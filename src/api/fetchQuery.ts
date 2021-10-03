const FETCH_QUERY = `
query ($username: String, $mediaPage: Int, $charactersPage: Int) {
  Page(page: $mediaPage, perPage: 50) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
      perPage
    }
    mediaList(userName: $username, type: ANIME) {
      id
      mediaId      
      status
      score
      media {
        title {
          romaji
          english
          native
        }
        coverImage {
          medium
          color
        }
        characters(page: $charactersPage, perPage: 25) {
          pageInfo {
            total
            perPage
            currentPage
            lastPage
            hasNextPage
          }
          edges {
            id
            role
            voiceActors(language: JAPANESE) {
              id
              name {
                first
                last
                full
                native
                alternative
              }
              image {
                medium
              }
              languageV2
            }
            node {
              id
              name {
                first
                last
                full
                native
                alternative
              }
              image {
                medium
              }
            }
          }
        }
      }
    }
  }
}
`;

export default FETCH_QUERY;
