/**
 * Decode HTML entities in a string (e.g. &#1605; → م).
 * The library returns HTML-encoded strings in some locales/languages,
 * so we decode them before sending JSON responses.
 */

import { Location } from "@aashari/nodejs-geocoding/dist/location.interface";

export function decodeHtmlEntities(str: string): string {
  return str.replace(/&#(\d+);/g, (_, code: string) =>
    String.fromCodePoint(parseInt(code, 10))
  );
}

/** Return a new Location with all string fields HTML-decoded. */
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
 