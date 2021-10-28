import classNames from "classnames";
import { PromiseFn } from "react-async";

import { ElementDefinition } from "cytoscape";

import Fuse from "fuse.js";

import { ApiCharacter, ApiVoiceActor, StoredCharacterConnection, StoredMediaList } from "@api";
import { db } from "@utils/db";

import Debug from "debug";
const debug = Debug("seiyuu:calc-graph");

export type GraphData = ElementDefinition[];

export interface FuseItem {
  id: string;
  names: string[];
}

export const resolveMediaList: PromiseFn<GraphData> = async ({
  graphData: _graphData, 
  mediaListId,
  fuse: _fuse,
  hideRoot: _hideRoot = true
}): Promise<ElementDefinition[]> => {
  if (typeof mediaListId !== "number") return [];
  const graphData = _graphData as GraphData;
  const fuse = _fuse as Fuse<FuseItem>;
  const hideRoot = _hideRoot as boolean;

  debug("resolving nodes from media list %d", mediaListId);

  // Items for search indexing
  const fuseItems: FuseItem[] = [];

  const mediaCache: MediaCache = {};
  const charCache: CharCache = {};
  const charConnCache: CharConnCache = {};
  const vaCache: VoiceActorCache = {};

  // Characters we've already seen, so they're not shown twice if they appear in
  // more than one media
  const seenChars: Record<number, true> = {};

  // Add a node for the original query anime, and mark it as the root
  await cacheMedia(mediaCache, [mediaListId]);
  if (!hideRoot) addMediaNode(graphData, fuseItems, mediaCache, mediaListId, true);

  // First, find the character connections by this mediaList id
  const mediaCharConnsJoin = await db.characterConnectionIdsMediaListIds
    .where({ mediaListId })
    .toArray();
  const mediaCharConnIds = mediaCharConnsJoin.map(c => c.characterConnectionId);
  const mediaCharConns = await db.characterConnections
    .bulkGet(mediaCharConnIds);

  // Cache all of those characters from their connections
  await cacheCharacters(charCache, charConnCache, mediaCharConns);

  // Add the inital character connection nodes (character + role)
  debug("adding first level character nodes");
  for (const conn of mediaCharConns) {
    // Mark as root character edge
    addCharacterNode(graphData, fuseItems, charCache, seenChars, mediaListId, conn, true, hideRoot);    
  }

  // For each of the characters from this media, get their voice actors
  const charVasJoin = await db.characterConnectionIdsVoiceActorIds
    .where("characterConnectionId")
    .anyOf(mediaCharConnIds)
    .toArray();
  const charVasJoinIds = charVasJoin.map(c => c.voiceActorId);
  await cacheVoiceActors(vaCache, charVasJoinIds);

  // Add the voice actors for each character connection
  for (const { voiceActorId, characterConnectionId } of charVasJoin) {
    addVoiceActorNode(graphData, fuseItems, charCache, vaCache[voiceActorId], charConnCache[characterConnectionId]);
  }

  // Now find the other character connections for each voice actor
  const vaCharsJoin = await db.characterConnectionIdsVoiceActorIds
    .where("voiceActorId")
    .anyOf(charVasJoinIds)
    .toArray();
  const vaCharsJoinIds = vaCharsJoin.map(c => c.characterConnectionId);
  const vaCharConns = await db.characterConnections
    .bulkGet(vaCharsJoinIds);

  // Cache all of those characters from their connections
  await cacheCharacters(charCache, charConnCache, vaCharConns);

  // Get the media for each new character connection too  
  const charConnMediasJoin = await db.characterConnectionIdsMediaListIds
    .where("characterConnectionId")
    .anyOf(vaCharsJoinIds)
    .toArray();

  // Map the character connection IDs to the media IDs and figure out which new
  // medias need to be fetched
  const charConnToMedia: Record<number, number> = {};
  const newMediaIds: Set<number> = new Set();
  for (const conn of charConnMediasJoin) {
    const connMediaListId = conn.mediaListId;

    const connId = conn.characterConnectionId;
    const curMediaId = charConnToMedia[connId]
    if (curMediaId === undefined || connMediaListId > curMediaId) 
      charConnToMedia[connId] = connMediaListId;

    // Add this to our list of media to fetch as long as it's not the root media
    if (connMediaListId !== mediaListId) {
      newMediaIds.add(connMediaListId);
    }
  }

  // Add all the new media
  const newMediaIdsArr = Array.from(newMediaIds);
  await cacheMedia(mediaCache, newMediaIdsArr);
  for (const mediaId of newMediaIdsArr) {
    addMediaNode(graphData, fuseItems, mediaCache, mediaId);
  }
  
  // Add all of those characters to the voice actor, skipping those in seenChars
  debug("adding second level character nodes");
  for (let i = 0; i < vaCharConns.length; i++) {
    const vaJoin = vaCharsJoin[i];
    const conn = vaCharConns[i]; 
    if (!vaJoin || !conn) continue;

    // Create the character and tie it to the new media
    const charMediaId = charConnToMedia[conn.id];
    if (charMediaId !== mediaListId) {
      addCharacterNode(graphData, fuseItems, charCache, seenChars, charMediaId, conn);
    }
    // And then add the edge to the old voice actor    
    addVoiceActorEdge(graphData, charCache, vaCache[vaJoin.voiceActorId], conn);
  }

  fuse.setCollection(fuseItems);
  return cleanGraph(graphData);
}

// =============================================================================
// add
// =============================================================================
function addCharacterNode(
  out: ElementDefinition[],
  fuseItems: FuseItem[],
  charCache: CharCache,
  seenChars: Record<number, true>,
  mediaListId: number,
  conn?: StoredCharacterConnection,
  rootCharacter?: boolean,
  hideRoot?: boolean
): void {
  if (!conn) return;
  const char = charCache[conn.characterId];
  if (!char) return;

  debug("char %d -> media %d", char.id, mediaListId);
  const nodeId = "character-" + char.id;

  // Edge to media (don't add if we're hiding the root node)
  if (!(rootCharacter && hideRoot)) {
    out.push({ 
      data: {
        id: nodeId + "-media-" + mediaListId,
        source: nodeId,
        target: "media-" + mediaListId
      },
      classes: rootCharacter ? "root-edge" : undefined
    });    
  }

  // Store this character in seenChars, so they're not shown twice if they
  // appear in more than one media. The edge is still added.
  if (seenChars[char.id]) return;
  seenChars[char.id] = true;

  // Character node
  out.push({ 
    data: { 
      id: nodeId,
      // parent: "media-" + mediaListId, // Parent is the first known media
      label: char.name.full ?? char.name.native ?? `Character ${char.id}`
    },
    classes: classNames("char", { "root-node-child": rootCharacter }),
    style: {
      "background-image": char.image.medium
    }
  });

  // Search index item
  fuseItems.push({
    id: nodeId,
    names: [char.name.full, char.name.native, `Character ${char.id}`]
  });
}

function addMediaNode(
  out: ElementDefinition[],
  fuseItems: FuseItem[],
  mediaCache: MediaCache,
  mediaId?: number,
  root?: boolean
): void {
  if (mediaId === undefined) return;
  const media = mediaCache[mediaId];
  if (!media) return;

  const nodeId = "media-" + mediaId;

  // Media node
  out.push({ 
    data: { 
      id: nodeId,
      label: media.media.title.english ?? media.media.title.romaji ?? media.media.title.native ?? `Media ${media.id}`,
    },
    classes: classNames("media", { "root-node": root }),
    position: root ? { x: 0, y: 0 } : undefined
  });

  // Search index item
  fuseItems.push({
    id: nodeId,
    names: [media.media.title.english, media.media.title.romaji, media.media.title.native, `Media ${media.id}`]
  });
}

function addVoiceActorNode(
  out: ElementDefinition[],
  fuseItems: FuseItem[],
  charCache: CharCache,
  voiceActor?: ApiVoiceActor,
  conn?: StoredCharacterConnection,
): void {
  if (!conn || !voiceActor) return;
  const char = charCache[conn.characterId];
  if (!char) return;

  const nodeId = "voice-actor-" + voiceActor.id;

  // Voice actor node
  out.push({ 
    data: { 
      id: nodeId,
      label: voiceActor.name.full ?? voiceActor.name.native ?? `Voice actor ${voiceActor.id}`
    },
    classes: "va",
    style: {
      "background-image": voiceActor.image.medium
    }
  });

  // Edge to character
  addVoiceActorEdge(out, charCache, voiceActor, conn);

  // Search index item
  fuseItems.push({
    id: nodeId,
    names: [voiceActor.name.full, voiceActor.name.native, `Voice actor ${voiceActor.id}`]
  });
}

function addVoiceActorEdge(
  out: ElementDefinition[],
  charCache: CharCache,
  voiceActor?: ApiVoiceActor,
  conn?: StoredCharacterConnection,
): void {
  if (!conn || !voiceActor) return;
  const char = charCache[conn.characterId];
  if (!char) return;

  // Edge to character
  out.push({ 
    data: {
      id: "voice-actor-" + voiceActor.id + "-character-" + char.id,
      source: "voice-actor-" + voiceActor.id,
      target: "character-" + char.id
    }
  });
}

// =============================================================================
// caching nonsense
// =============================================================================
type CharCache = Record<number, ApiCharacter>;
type CharConnCache = Record<number, StoredCharacterConnection>;
async function cacheCharacters(
  cache: CharCache,
  charConnCache: CharConnCache,
  characterConnections: (StoredCharacterConnection | undefined)[]
): Promise<void> {
  for (const conn of characterConnections) {
    if (!conn) continue;
    charConnCache[conn.id] = conn;
  }

  const fetchCharacters = characterConnections
    .filter(c => c && !cache[c.characterId])
    .map(c => c!.characterId);

  const characters = await db.characters.bulkGet(fetchCharacters);
  for (const char of characters) {
    if (!char) continue;
    cache[char.id] = char;
  }
}

type MediaCache = Record<number, StoredMediaList>;
async function cacheMedia(
  cache: MediaCache,
  mediaListIds: (number | undefined)[]
): Promise<void> {
  const fetchMedia = mediaListIds
    .filter(id => id !== undefined && !cache[id]);

  const mediaLists = await db.mediaList.bulkGet(fetchMedia as number[]);
  for (const mediaList of mediaLists) {
    if (!mediaList) continue;
    cache[mediaList.id] = mediaList;
  }
}

type VoiceActorCache = Record<number, ApiVoiceActor>;
async function cacheVoiceActors(
  cache: VoiceActorCache,
  voiceActorIds: (number | undefined)[]
): Promise<void> {
  const fetchIds = voiceActorIds
    .filter(id => id !== undefined && !cache[id]);

  const vas = await db.voiceActors.bulkGet(fetchIds as number[]);
  for (const va of vas) {
    if (!va) continue;
    cache[va.id] = va;
  }
}

// =============================================================================
// prep
// =============================================================================
/** deduplicate graph data */
function cleanGraph(graphData: GraphData): GraphData {
  const seen: Record<string, true> = {};
  const out: GraphData = [];

  for (const el of graphData) {
    const id = el?.data?.id;
    if (!id || seen[id]) continue;

    out.push(el);
    seen[id] = true;
  }

  return out;
}
