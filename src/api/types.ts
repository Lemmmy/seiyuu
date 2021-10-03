export interface ApiMediaFetchRes {
  data: {
    Page: {
      pageInfo: ApiPageInfo;
      mediaList: ApiMediaList[];
    }
  }
}

export interface ApiPageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
  perPage: number;
}

export type ApiMediaListStatus = "CURRENT" | "PLANNING" | "COMPELTED" 
  | "DROPPED" | "PAUSED" | "REPEATING";

export interface ApiMediaList {
  id: number;
  mediaId: number;
  status: ApiMediaListStatus;
  score: number;
  media: ApiMedia;
}
export type StoredMediaList = Omit<ApiMediaList, "media"> & {
  media: StoredMedia;
};

export interface ApiMedia {
  title: {
    romaji: string;
    english: string;
    native: string;
  }

  coverImage: {
    medium: string;
    color: string;
  }

  characters: {
    pageInfo: ApiPageInfo;
    edges: ApiCharacterConnectionEdge[];
  }
}
export type StoredMedia = Omit<ApiMedia, "characters">;

export type ApiCharacterRole = "MAIN" | "SUPPORTING" | "BACKGROUND";
export interface ApiCharacterConnectionEdge {
  id: number;
  role: ApiCharacterRole;
  voiceActors: ApiVoiceActor[];
  node: ApiCharacter;
}

export interface StoredCharacterConnection {
  id: number;
  role: ApiCharacterRole;
  characterId: number; 
}

export interface ApiNameBase {  
  first: string;
  last: string;
  full: string;
  native: string;
  alternative: string[];
}
export type ApiCharacterName = ApiNameBase;
export type ApiStaffName = ApiNameBase;

export interface ApiCharacter {
  id: number;
  name: ApiCharacterName;
  image: {
    medium: string;
  }
} 

export interface ApiVoiceActor {
  id: number;
  name: ApiStaffName;
  image: {
    medium: string;
  }
  languageV2: string;
}

export interface ApiGraphqlRequest {
  query: string;
  variables: {
    username: string;
    mediaPage: number;
    charactersPage: number;
  }
}
