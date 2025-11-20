import { gql } from "@apollo/client";

export const GET_CHARACTERS_PAGINATED = gql`
  query GetCharactersPaginated($page: Int!) {
    characters(page: $page) {
      info {
        pages
        next
        prev
      }
      results {
        id
        name
        image
      }
    }
  }
`;