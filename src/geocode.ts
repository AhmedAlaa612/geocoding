import { encode, EncodeOptions } from '../lib/nodejs-geocoding/src/index';
import { Location } from '../lib/nodejs-geocoding/src/location.interface';
import { ALEXANDRIA_BOUNDS, ALEXANDRIA_CENTER, decodeLocation } from './utils';

/**
 * Forward geocode with optional Alexandria bias.
 *
 * When bias=true:
 *   - countryCode 'eg' is passed so Google knows we're in Egypt
 *   - bounds is set to Alexandria's bounding box to keep results local
 *   - The viewport center defaults to Alexandria city center, but if the
 *     caller passes userLat/userLng (the user's actual device coordinates),
 *     those are used instead — giving proximity-aware ranking within the box
 *     (e.g. a user in Montaza gets nearby KFCs, not ones in Smouha)
 */
export async function geocodeWithBias(
  address: string,
  language: string,
  bias: boolean,
  userLat?: number,
  userLng?: number,
): Promise<Location[]> {

  // Determine viewport center: user location > Alexandria center
  const viewportCenter = (userLat !== undefined && userLng !== undefined)
    ? { lat: userLat, lng: userLng }
    : ALEXANDRIA_CENTER;

  const options: EncodeOptions = {
    language,
    ...(bias && {
      countryCode: 'eg',
      bounds: {
        sw: { lat: ALEXANDRIA_BOUNDS.minLat, lng: ALEXANDRIA_BOUNDS.minLng },
        ne: { lat: ALEXANDRIA_BOUNDS.maxLat, lng: ALEXANDRIA_BOUNDS.maxLng },
      },
      viewportCenter,
    }),
  };

  const results = await encode(address, options);
  return results.map(decodeLocation);
}