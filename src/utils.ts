import { Location } from "../lib/nodejs-geocoding/src/location.interface";

export function decodeHtmlEntities(str: string): string {
  return str.replace(/&#(\d+);/g, (_, code: string) =>
    String.fromCodePoint(parseInt(code, 10))
  );
}

export function decodeLocation(location: Location): Location {
  return {
    ...location,
    formatted_address: location.formatted_address
      ? decodeHtmlEntities(location.formatted_address)
      : location.formatted_address,
    google_plus_code: location.google_plus_code
      ? decodeHtmlEntities(location.google_plus_code)
      : location.google_plus_code,
  };
}

export const ALEXANDRIA_BOUNDS = {
  minLat: 30.85,
  maxLat: 31.42,
  minLng: 29.52,
  maxLng: 30.25,
} as const;

export const ALEXANDRIA_CENTER = {
  lat: 31.2001,
  lng: 29.9187,
};

export function isInAlexandria(location: { latitude?: number; longitude?: number }): boolean {
  const { latitude, longitude } = location;
  if (latitude === undefined || longitude === undefined) return false;
  return (
    latitude  >= ALEXANDRIA_BOUNDS.minLat &&
    latitude  <= ALEXANDRIA_BOUNDS.maxLat &&
    longitude >= ALEXANDRIA_BOUNDS.minLng &&
    longitude <= ALEXANDRIA_BOUNDS.maxLng
  );
}