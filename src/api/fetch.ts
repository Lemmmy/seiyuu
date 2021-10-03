import { ApiCharacter, ApiMediaFetchRes, ApiVoiceActor, StoredCharacterConnection, StoredMediaList } from "api";
import { CharacterConnectionIdMediaListId, CharacterConnectionIdVoiceActorId, db } from "@utils/db";

import axios, { AxiosResponse } from "axios";
import { range } from "lodash-es";
import PQueue from "p-queue";

import FETCH_QUERY from "./fetchQuery";

import { lsSetString } from "@utils";

import Debug from "debug";
const debug = Debug("seiyuu:fetch");

export const API_ROOT = "https://graphql.anilist.co";

const PARALLEL_FETCH_TASKS = 6;
const fetchQueue = new PQueue({
  concurrency: PARALLEL_FETCH_TASKS
});

export async function fetchData(username: string): Promise<void> {
  // Nuke the db ☢️
  await db.mediaList.clear();
  await db.characterConnections.clear();
  await db.characters.clear();
  await db.voiceActors.clear();
  await db.characterConnectionIdsMediaListIds.clear();
  await db.characterConnectionIdsVoiceActorIds.clear();

  await requestPage(username, 1, 1);
  await fetchQueue.onEmpty();
  debug("queue empty");

  lsSetString("lastFetch", new Date().toISOString());
}

export async function requestPage(
  username: string, 
  mediaPage: number,
  charactersPage: number
): Promise<ApiMediaFetchRes> {
  debug("fetching %s %d %d", username, mediaPage, charactersPage);

  const { data } = await axios.post<{}, AxiosResponse<ApiMediaFetchRes>>(API_ROOT, {
    query: FETCH_QUERY,
    variables: { username, mediaPage, charactersPage }
  });

  // Store everything new in the database
  // Only store the media on the first characters page
  if (charactersPage === 1) {
    const insertMedia: StoredMediaList[] = [];
    
    // Remove the `characters` from the stored media
    for (const mediaList of data.data.Page.mediaList) {
      const { characters: _, ...mediaRest } = mediaList.media;
      insertMedia.push({
        ...mediaList,
        media: mediaRest
      })
    }

    debug("inserting %d media", insertMedia.length);
    await db.mediaList.bulkPut(insertMedia);
  }

  // Store all characters and voice actors we can find, along with their
  // relationships
  const insertCharacterConnections: StoredCharacterConnection[] = [];
  const insertCharacters: Record<number, ApiCharacter> = {};
  const insertVoiceActors: Record<number, ApiVoiceActor> = {};
  const insertCharacterConnectionIdsMediaListIds: Omit<CharacterConnectionIdMediaListId, "id">[] = [];
  const insertCharacterConnectionIdsVoiceActorIds: Omit<CharacterConnectionIdVoiceActorId, "id">[] = [];
  
  for (const mediaList of data.data.Page.mediaList) {
    // Characters
    for (const edge of mediaList.media.characters.edges) {
      const edgeId = edge.id;
      const charId = edge.node.id;

      // Insert the character itself to the DB if we haven't seen it yet
      if (!insertCharacters[charId]) {
        insertCharacters[charId] = edge.node;
      }

      // Create the character connection to link VAs and media to
      insertCharacterConnections.push({ 
        id: edgeId,
        role: edge.role, 
        characterId: charId 
      });

      // Link the character connection to this media list entry
      insertCharacterConnectionIdsMediaListIds.push({ 
        characterConnectionId: edgeId,
        mediaListId: mediaList.id
      });

      // Voice actors
      for (const voiceActor of edge.voiceActors) {
        const vaId = voiceActor.id;

        // Link this character and voice actor together
        insertCharacterConnectionIdsVoiceActorIds.push({
          characterConnectionId: edgeId,
          voiceActorId: vaId
        });
        
        // Add the voice actor itself to the DB if we haven't seen it yet
        if (!insertVoiceActors[vaId]) {
          insertVoiceActors[vaId] = voiceActor;
        }
      }
    }
  }

  // Insert all those extra items and links
  await Promise.all([
    db.characterConnections.bulkPut(insertCharacterConnections),
    db.characters.bulkPut(Object.values(insertCharacters)),
    db.voiceActors.bulkPut(Object.values(insertVoiceActors)),
    db.characterConnectionIdsMediaListIds.bulkPut(insertCharacterConnectionIdsMediaListIds as CharacterConnectionIdMediaListId[]),
    db.characterConnectionIdsVoiceActorIds.bulkPut(insertCharacterConnectionIdsVoiceActorIds as CharacterConnectionIdVoiceActorId[]),
  ]);

  debug("added %d character connections", insertCharacterConnections.length);
  debug("added %d characters", Object.values(insertCharacters).length);
  debug("added %d voice actors", Object.values(insertVoiceActors).length);
  debug("added %d characterConnectionIdsMediaListIds", insertCharacterConnectionIdsMediaListIds.length);
  debug("added %d characterConnectionIdsVoiceActorIds", insertCharacterConnectionIdsVoiceActorIds.length);

  // Figure out what to fetch next
  if (charactersPage === 1) {
    // If we're fetching the first character page, find the most we'll need to
    // fetch and queue those too. And also clap your handsstrings
    const maxCharPages = data.data.Page.mediaList
      .reduce((acc, m) => Math.max(acc, m.media.characters.pageInfo.lastPage), 1);
    fetchQueue.addAll(range(2, maxCharPages + 1)
      .map(p => () => requestPage(username, mediaPage, p)));

    if (mediaPage === 1) {
      // If we're fetching the first media page, queue all the other media pages
      // clap your fingers 👏👏
      const mediaPages = data.data.Page.pageInfo.lastPage;
      fetchQueue.addAll(range(2, mediaPages + 1)
        .map(p => () => requestPage(username, p, 1)));
    }
  }

  return data;
}
