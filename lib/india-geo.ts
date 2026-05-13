export type IndiaStateGeo = {
  state: string;
  latitude: number;
  longitude: number;
};

export const INDIA_STATE_GEO: IndiaStateGeo[] = [
  { state: "Andhra Pradesh", latitude: 15.9129, longitude: 79.74 },
  { state: "Arunachal Pradesh", latitude: 28.218, longitude: 94.7278 },
  { state: "Assam", latitude: 26.2006, longitude: 92.9376 },
  { state: "Bihar", latitude: 25.0961, longitude: 85.3131 },
  { state: "Chhattisgarh", latitude: 21.2787, longitude: 81.8661 },
  { state: "Goa", latitude: 15.2993, longitude: 74.124 },
  { state: "Gujarat", latitude: 22.2587, longitude: 71.1924 },
  { state: "Haryana", latitude: 29.0588, longitude: 76.0856 },
  { state: "Himachal Pradesh", latitude: 31.1048, longitude: 77.1734 },
  { state: "Jharkhand", latitude: 23.6102, longitude: 85.2799 },
  { state: "Karnataka", latitude: 15.3173, longitude: 75.7139 },
  { state: "Kerala", latitude: 10.8505, longitude: 76.2711 },
  { state: "Madhya Pradesh", latitude: 22.9734, longitude: 78.6569 },
  { state: "Maharashtra", latitude: 19.7515, longitude: 75.7139 },
  { state: "Manipur", latitude: 24.6637, longitude: 93.9063 },
  { state: "Meghalaya", latitude: 25.467, longitude: 91.3662 },
  { state: "Mizoram", latitude: 23.1645, longitude: 92.9376 },
  { state: "Nagaland", latitude: 26.1584, longitude: 94.5624 },
  { state: "Odisha", latitude: 20.9517, longitude: 85.0985 },
  { state: "Punjab", latitude: 31.1471, longitude: 75.3412 },
  { state: "Rajasthan", latitude: 27.0238, longitude: 74.2179 },
  { state: "Sikkim", latitude: 27.533, longitude: 88.5122 },
  { state: "Tamil Nadu", latitude: 11.1271, longitude: 78.6569 },
  { state: "Telangana", latitude: 18.1124, longitude: 79.0193 },
  { state: "Tripura", latitude: 23.9408, longitude: 91.9882 },
  { state: "Uttar Pradesh", latitude: 26.8467, longitude: 80.9462 },
  { state: "Uttarakhand", latitude: 30.0668, longitude: 79.0193 },
  { state: "West Bengal", latitude: 22.9868, longitude: 87.855 },
  { state: "Delhi", latitude: 28.7041, longitude: 77.1025 },
  { state: "Jammu and Kashmir", latitude: 33.7782, longitude: 76.5762 },
  { state: "Ladakh", latitude: 34.2268, longitude: 77.5619 },
  { state: "Puducherry", latitude: 11.9416, longitude: 79.8083 },
  { state: "Chandigarh", latitude: 30.7333, longitude: 76.7794 },
  { state: "Andaman and Nicobar Islands", latitude: 11.7401, longitude: 92.6586 },
  { state: "Dadra and Nagar Haveli and Daman and Diu", latitude: 20.1809, longitude: 73.0169 },
  { state: "Lakshadweep", latitude: 10.5667, longitude: 72.6417 },
];

export const INDIA_STATES = INDIA_STATE_GEO.map((item) => item.state);

export function getStateCentroid(state: string | null | undefined) {
  if (!state) return null;
  return INDIA_STATE_GEO.find((item) => item.state === state) ?? null;
}

export function haversineKm(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const latitudeDelta = toRadians(toLatitude - fromLatitude);
  const longitudeDelta = toRadians(toLongitude - fromLongitude);
  const fromLat = toRadians(fromLatitude);
  const toLat = toRadians(toLatitude);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2) *
      Math.cos(fromLat) *
      Math.cos(toLat);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}
