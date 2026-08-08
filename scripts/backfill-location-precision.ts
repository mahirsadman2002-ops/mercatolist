// One-time backfill: set locationPrecision for listings imported without a
// street address. Borough-only rows → BOROUGH. Rows with a neighborhood get
// geocoded onto that neighborhood (they previously sat on the borough
// centroid) → NEIGHBORHOOD. Listings with a real address stay EXACT.
import { prisma } from "../lib/prisma";
import { geocodeAddress } from "../lib/mapbox";

async function main() {
  const noAddress = await prisma.businessListing.findMany({
    where: { address: "" },
    select: { id: true, title: true, neighborhood: true, borough: true, locationPrecision: true },
  });
  console.log(`${noAddress.length} listings with no street address`);

  for (const l of noAddress) {
    if (!l.neighborhood) {
      await prisma.businessListing.update({
        where: { id: l.id },
        data: { locationPrecision: "BOROUGH" },
      });
      console.log(`BOROUGH      ${l.borough}  "${l.title}"`);
      continue;
    }
    const boroughLabel = l.borough
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b[a-z]/g, (c) => c.toUpperCase());
    let geo = null;
    try {
      geo = await geocodeAddress(`${l.neighborhood}, ${boroughLabel}, NY`);
    } catch {}
    if (geo) {
      await prisma.businessListing.update({
        where: { id: l.id },
        data: {
          locationPrecision: "NEIGHBORHOOD",
          latitude: geo.latitude,
          longitude: geo.longitude,
        },
      });
      console.log(`NEIGHBORHOOD ${l.neighborhood}, ${l.borough}  "${l.title}"`);
    } else {
      await prisma.businessListing.update({
        where: { id: l.id },
        data: { locationPrecision: "BOROUGH" },
      });
      console.log(`BOROUGH      ${l.borough}  "${l.title}" (neighborhood geocode failed: ${l.neighborhood})`);
    }
  }
}
main().finally(() => prisma.$disconnect());
