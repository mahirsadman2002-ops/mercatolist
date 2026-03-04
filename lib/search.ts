import { MeiliSearch } from "meilisearch";

export const searchClient = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || "http://localhost:7700",
  apiKey: process.env.MEILISEARCH_API_KEY,
});

export const LISTINGS_INDEX = "listings";

export async function configureSearchIndex() {
  const index = searchClient.index(LISTINGS_INDEX);

  await index.updateSearchableAttributes([
    "title",
    "description",
    "category",
    "neighborhood",
    "borough",
    "address",
  ]);

  await index.updateFilterableAttributes([
    "status",
    "category",
    "borough",
    "neighborhood",
    "askingPrice",
    "annualRevenue",
    "yearEstablished",
    "sellerFinancing",
    "sbaFinancingAvailable",
    "ownerInvolvement",
  ]);

  await index.updateSortableAttributes([
    "askingPrice",
    "annualRevenue",
    "createdAt",
    "viewCount",
  ]);

  return index;
}
