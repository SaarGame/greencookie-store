import type { ResultOf } from "gql.tada";
import { vendureClient } from "../util/vendure-client";
import { graphql } from "../../graphql/graphql";

const AvailableCountriesQuery = graphql(`
  query AvailableCountries {
    availableCountries {
      id
      code
      name
    }
  }
`);

export type AvailableCountry = ResultOf<
  typeof AvailableCountriesQuery
>["availableCountries"][number];

export async function getAvailableCountries(
  locale: string,
): Promise<AvailableCountry[]> {
  const result = await vendureClient(locale).request(AvailableCountriesQuery);
  return result.availableCountries;
}
