import { encode, EncodeOptions } from '../lib/nodejs-geocoding/src/index';
import { Location } from '../lib/nodejs-geocoding/src/location.interface';
import { ALEXANDRIA_BOUNDS, decodeLocation } from './utils';

export async function geocodeWithBias(
  address: string,
  language: string,
  bias: boolean,
  userLat?: number,
  userLng?: number,
): Promise<Location[]> {
  const options: EncodeOptions = {
    language,
    ...(bias && {
      locationHint: 'Alexandria, Egypt',
      bounds: {
        sw: { lat: ALEXANDRIA_BOUNDS.minLat, lng: ALEXANDRIA_BOUNDS.minLng },
        ne: { lat: ALEXANDRIA_BOUNDS.maxLat, lng: ALEXANDRIA_BOUNDS.maxLng },
      },
    }),
    ...(userLat !== undefined && userLng !== undefined && {
      userCoords: { lat: userLat, lng: userLng },
    }),
  };

  const results = await encode(address, options);
  return results.map(decodeLocation);
}