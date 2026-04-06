interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

interface ReverseGeocodeResult {
  neighborhood?: string;
  borough?: string;
  zipCode?: string;
  formattedAddress: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) throw new Error("MAPBOX_ACCESS_TOKEN is not set");

  const encodedAddress = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${token}&limit=1&country=US&bbox=-74.26,40.49,-73.70,40.92`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();

  if (!data.features || data.features.length === 0) return null;

  const feature = data.features[0];
  const [longitude, latitude] = feature.center;

  return {
    latitude,
    longitude,
    formattedAddress: feature.place_name,
  };
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) throw new Error("MAPBOX_ACCESS_TOKEN is not set");

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&types=neighborhood,postcode,district&limit=5`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();

  if (!data.features || data.features.length === 0) return null;

  let neighborhood: string | undefined;
  let borough: string | undefined;
  let zipCode: string | undefined;

  for (const feature of data.features) {
    if (feature.place_type?.includes("neighborhood") && !neighborhood) {
      neighborhood = feature.text;
    }
    if (feature.place_type?.includes("district") && !borough) {
      borough = feature.text;
    }
    if (feature.place_type?.includes("postcode") && !zipCode) {
      zipCode = feature.text;
    }
  }

  return {
    neighborhood,
    borough,
    zipCode,
    formattedAddress: data.features[0].place_name,
  };
}

export async function searchAddresses(
  query: string,
  limit = 5
): Promise<Array<{ address: string; latitude: number; longitude: number }>> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) throw new Error("MAPBOX_ACCESS_TOKEN is not set");

  const encodedQuery = encodeURIComponent(query);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${token}&limit=${limit}&country=US&bbox=-74.26,40.49,-73.70,40.92&types=address`;

  const response = await fetch(url);
  if (!response.ok) return [];

  const data = await response.json();

  if (!data.features) return [];

  return data.features.map((feature: { place_name: string; center: [number, number] }) => ({
    address: feature.place_name,
    latitude: feature.center[1],
    longitude: feature.center[0],
  }));
}
