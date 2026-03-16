import request from "graphql-request";
import type { ResultOf } from "gql.tada";
import { cache, vendureApi } from "../../config";
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
    request(vendureApi(locale), AvailableCountriesQuery);
  const result = await cache.get(
    `available-countries-${locale}`,
    getAvailableCountries,
  );
  return result.availableCountries;
}
