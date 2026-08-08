// Fix rows whose "neighborhood" is just the borough name: that's borough-level
// knowledge. Clear the fake neighborhood and set BOROUGH precision.
import { prisma } from "../lib/prisma";
import { boroughCenter } from "../lib/nyc-geo";

async function main() {
  const rows = await prisma.businessListing.findMany({
    where: { address: "" },
    select: { id: true, title: true, neighborhood: true, borough: true },
  });
  for (const l of rows) {
    const label = l.borough.replace(/_/g, " ").toLowerCase();
    if (l.neighborhood && l.neighborhood.trim().toLowerCase() === label) {
      const c = boroughCenter(l.borough);
      await prisma.businessListing.update({
        where: { id: l.id },
        data: {
          neighborhood: "",
          locationPrecision: "BOROUGH",
          latitude: c.lat,
          longitude: c.lng,
        },
      });
      console.log(`fixed: "${l.title}" (${l.neighborhood} → borough-level ${l.borough})`);
    }
  }
}
main().finally(() => prisma.$disconnect());
