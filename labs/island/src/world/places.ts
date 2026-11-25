// Placeholder destinations. Positions are real coordinates so the owl crosses
// real terrain, but names and sites are NOT cultural claims; the content team
// must choose and approve real locations.
export type Place = { id: string; name: string; lon: number; lat: number; open?: boolean };
export const HOME: Place = { id: "home", name: "Owl's perch", lon: 141.35, lat: 43.06 };
export const PLACES: Place[] = [
  { id: "lake", name: "Lake house", lon: 141.33, lat: 42.77, open: true },
  { id: "forest", name: "Forest workshop", lon: 142.45, lat: 43.62 },
  { id: "river", name: "River village", lon: 142.15, lat: 42.63 },
  { id: "coast", name: "Coast lookout", lon: 144.95, lat: 44.05 },
];
export const FLOWER_FIELD = { lon: 142.42, lat: 43.33 };
