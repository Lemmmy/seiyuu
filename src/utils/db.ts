import Dexie from "dexie";

import { StoredMediaList, StoredCharacterConnection, ApiCharacter, ApiVoiceActor } from "@api";

export interface CharacterConnectionIdMediaListId 
  { id: number; characterConnectionId: number; mediaListId: number; };
export interface CharacterConnectionIdVoiceActorId 
  { id: number; characterConnectionId: number; voiceActorId: number; };

class SeiyuuDb extends Dexie {
  mediaList: Dexie.Table<StoredMediaList, number>;
  characterConnections: Dexie.Table<StoredCharacterConnection, number>;
  characters: Dexie.Table<ApiCharacter, number>;
  voiceActors: Dexie.Table<ApiVoiceActor, number>;

  characterConnectionIdsMediaListIds: Dexie.Table<CharacterConnectionIdMediaListId, number>;
  characterConnectionIdsVoiceActorIds: Dexie.Table<CharacterConnectionIdVoiceActorId, number>;

  constructor() {
    super("seiyuu");

    this.version(6).stores({
      mediaList: "++id",
      characterConnections: "++id",
      characters: "++id",
      voiceActors: "++id",
      characterConnectionIdsMediaListIds: "++id, characterConnectionId, mediaListId",
      characterConnectionIdsVoiceActorIds: "++id, characterConnectionId, voiceActorId",
    });

    this.mediaList = this.table("mediaList");
    this.characterConnections = this.table("characterConnections");
    this.characters = this.table("characters");
    this.voiceActors = this.table("voiceActors");
    this.characterConnectionIdsMediaListIds = this.table("characterConnectionIdsMediaListIds");
    this.characterConnectionIdsVoiceActorIds = this.table("characterConnectionIdsVoiceActorIds");
  }
}

export let db: SeiyuuDb;

export async function initDatabase(): Promise<SeiyuuDb> {
  if (db) return db;
  db = new SeiyuuDb();
  return db;
}
