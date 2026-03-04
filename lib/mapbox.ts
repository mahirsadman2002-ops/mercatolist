interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) throw new Error("MAPBOX_ACCESS_TOKEN is not set");

  const encodedAddress = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${token}&limit=1&country=US&bbox=-74.26,40.49,-73.70,40.92`;

  const response = await fetch(url);
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
