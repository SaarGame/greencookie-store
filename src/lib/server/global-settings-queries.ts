import { graphql } from "../../graphql/graphql";

export const AvailableCountriesQuery = graphql(`
  query AvailableCountries {
    availableCountries {
      id
      code
      name
    }
  }
`);
