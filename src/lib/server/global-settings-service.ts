import type { ResultOf } from "gql.tada";
import { cache } from "../../config";
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
  const getAvailableCountries = () =>
    vendureClient(locale).request(AvailableCountriesQuery);
  const result = await cache.get(
    `available-countries-${locale}`,
    getAvailableCountries,
  );
  return result.availableCountries;
}
