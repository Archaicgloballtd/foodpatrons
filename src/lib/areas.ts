// Approximate centroid coordinates for the Dhaka neighborhoods this site
// covers. Used only to figure out which area a visitor is closest to (for
// "near me" sorting) — not stored anywhere or presented as precise.
export const AREA_CENTROIDS: { area: string; lat: number; lng: number }[] = [
  { area: "Gulshan", lat: 23.7925, lng: 90.4078 },
  { area: "Banani", lat: 23.7936, lng: 90.4066 },
  { area: "Dhanmondi", lat: 23.7461, lng: 90.3742 },
  { area: "Uttara", lat: 23.8759, lng: 90.3795 },
  { area: "Mirpur", lat: 23.8223, lng: 90.3654 },
];

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearestArea(location: { lat: number; lng: number }): string {
  let closest = AREA_CENTROIDS[0];
  let closestDist = Infinity;
  for (const c of AREA_CENTROIDS) {
    const d = haversineKm(location, c);
    if (d < closestDist) {
      closestDist = d;
      closest = c;
    }
  }
  return closest.area;
}

// City centers used only to label the navbar pill with the visitor's
// nearest district/division — not stored anywhere or presented as precise.
// Covers all 8 divisional capitals plus Cox's Bazar, since it's a distinct,
// well-known tourist district in its own right even though it sits inside
// Chattogram division.
export const DISTRICT_CENTROIDS: { name: string; lat: number; lng: number }[] = [
  { name: "Dhaka", lat: 23.8103, lng: 90.4125 },
  { name: "Chattogram", lat: 22.3569, lng: 91.7832 },
  { name: "Cox's Bazar", lat: 21.4272, lng: 92.0058 },
  { name: "Rajshahi", lat: 24.3745, lng: 88.6042 },
  { name: "Khulna", lat: 22.8456, lng: 89.5403 },
  { name: "Barisal", lat: 22.701, lng: 90.3535 },
  { name: "Sylhet", lat: 24.8949, lng: 91.8687 },
  { name: "Rangpur", lat: 25.7439, lng: 89.2752 },
  { name: "Mymensingh", lat: 24.7471, lng: 90.4203 },
];

export function nearestDistrict(location: { lat: number; lng: number }): string {
  let closest = DISTRICT_CENTROIDS[0];
  let closestDist = Infinity;
  for (const c of DISTRICT_CENTROIDS) {
    const d = haversineKm(location, c);
    if (d < closestDist) {
      closestDist = d;
      closest = c;
    }
  }
  return closest.name;
}
