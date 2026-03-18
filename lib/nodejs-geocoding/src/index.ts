import { Location } from './location.interface';
import { get } from './request.handler';

export const VERSION = '2.7.2';

type GoogleMapsJsonResponse = Record<string, unknown>;

const tryParseJSON = (json: string): GoogleMapsJsonResponse | null => {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export interface EncodeOptions {
  language?: string;
  locationHint?: string;
  bounds?: {
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  };
  userCoords?: {
    lat: number;
    lng: number;
  };
}

export async function encode(
  formattedAddress: string,
  languageOrOptions: string | EncodeOptions = 'en',
): Promise<Location[]> {

  const options: EncodeOptions =
    typeof languageOrOptions === 'string'
      ? { language: languageOrOptions }
      : languageOrOptions;

  const language = options.language ?? 'en';
  const bounds = options.bounds;
  const userCoords = options.userCoords;
  const locationHint = options.locationHint;

  const query = locationHint
    ? `${formattedAddress} ${locationHint}`
    : formattedAddress;

  let pb = '!2i4!4m12!1m3!1d47768.67838190306!2d29.902868658279324!3d31.21938689710795!2m3!1f0!2f0!3f0!3m2!1i1707!2i336!4f13.1!7i20!10b1!12m25!1m5!18b1!30b1!31m1!1b1!34e1!2m4!5m1!6e2!20e3!39b1!10b1!12b1!13b1!16b1!17m1!3e1!20m3!5e2!6b1!14b1!46m1!1b0!96b1!99b1!19m4!2m3!1i360!2i120!4i8!20m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240!7m33!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!1m3!1e9!2b1!3e2!2b1!9b0!15m8!1m7!1m2!1m1!1e2!2m2!1i195!2i195!3i20!22m3!1skeK5aaa6MMmqkdUP1ueEgA8!7e81!17skeK5aaa6MMmqkdUP1ueEgA8:540!23m2!4b1!10b1!24m109!1m27!13m9!2b1!3b1!4b1!6i1!8b1!9b1!14b1!20b1!25b1!18m16!3b1!4b1!5b1!6b1!9b1!13b1!14b1!17b1!20b1!21b1!22b1!32b1!33m1!1b1!34b1!36e2!10m1!8e3!11m1!3e1!17b1!20m2!1e3!1e6!24b1!25b1!26b1!27b1!29b1!30m1!2b1!36b1!37b1!39m3!2m2!2i1!3i1!43b1!52b1!54m1!1b1!55b1!56m1!1b1!61m2!1m1!1e1!65m5!3m4!1m3!1m2!1i224!2i298!72m22!1m8!2b1!5b1!7b1!12m4!1b1!2b1!4m1!1e1!4b1!8m10!1m6!4m1!1e1!4m1!1e3!4m1!1e4!3sother_user_google_review_posts__and__hotel_and_vr_partner_review_posts!6m1!1e1!9b1!89b1!90m2!1m1!1e2!98m3!1b1!2b1!3b1!103b1!113b1!114m3!1b1!2m1!1b1!117b1!122m1!1b1!126b1!127b1!128m1!1b0!26m4!2m3!1i80!2i92!4i8!34m19!2b1!3b1!4b1!6b1!8m6!1b1!3b1!4b1!5b1!6b1!7b1!9b1!12b1!14b1!20b1!23b1!25b1!26b1!31b1!37m1!1e81!47m0!49m10!3b1!6m2!1b1!2b1!7m2!1e3!2b1!8b1!9b1!10e2!61b1!67m5!7b1!10b1!14b1!15m1!1b0!69i771!77b1';

  if (userCoords) {
    pb = pb
      .replace('!2d29.902868658279324', `!2d${userCoords.lng}`)
      .replace('!3d31.21938689710795', `!3d${userCoords.lat}`);
  }

  const url = `https://www.google.com/s?gs_ri=maps&authuser=0&hl=${language}&pb=${pb}&q=${encodeURI(query)}`;

  const googleResponse = await get(url);

  const rawCleaningFiltered: GoogleMapsJsonResponse[] = googleResponse
    ?.split('\n')
    .map((line) => tryParseJSON(line.trim()))
    .filter((json): json is GoogleMapsJsonResponse => json !== null);

  if (
    !rawCleaningFiltered[0] ||
    !Array.isArray(rawCleaningFiltered[0][0]) ||
    !Array.isArray(rawCleaningFiltered[0][0][1])
  ) {
    return [];
  }

  type ItemDetailed = {
    0: Array<string>;
    11: Array<string>;
    [key: number]: unknown;
  };

  type MapItem = {
    22: ItemDetailed;
    [key: number]: unknown;
  };

  const locationList = (rawCleaningFiltered[0][0][1] as unknown as MapItem[]).map(
    (item) => {
      const itemDetailed = item[22];
      if (!itemDetailed) return null;
      if (!itemDetailed[0] || !itemDetailed[0][0]) return null;
      if (!itemDetailed[11] || !itemDetailed[11][2] || !itemDetailed[11][3])
        return null;

      return {
        latitude: parseFloat(itemDetailed[11][2].toString().trim()),
        longitude: parseFloat(itemDetailed[11][3].toString().trim()),
        formatted_address: itemDetailed[0][0].toString().trim(),
      } as Location;
    },
  );

  let results = locationList.filter(
    (location): location is Location => location !== null,
  );

  // Drop anything outside the bounding box
  if (bounds) {
    results = results.filter(
      (loc) =>
        loc.latitude !== undefined &&
        loc.longitude !== undefined &&
        loc.latitude  >= bounds.sw.lat &&
        loc.latitude  <= bounds.ne.lat &&
        loc.longitude >= bounds.sw.lng &&
        loc.longitude <= bounds.ne.lng,
    );
  }

  return results;
}

export async function decode(
  latitude: number,
  longitude: number,
  language: string = 'en',
): Promise<Location | null> {
  const location: Location = { latitude, longitude };

  const googleResponse = await get(
    `https://www.google.com/maps/search/?api=1&hl=${language}&query=${latitude}%2C${longitude}`,
  );

  const plusCodePattern = new RegExp(`([A-Z0-9]{4}\\+[A-Z0-9]{2,3}\\s[^"<>]+)`);
  const plusCodeMatch = googleResponse.match(plusCodePattern);

  if (plusCodeMatch && plusCodeMatch[1]) {
    location.google_plus_code = plusCodeMatch[1].split('\\')[0];
    const locationParts = location.google_plus_code.split(' ');
    if (locationParts.length > 1) {
      locationParts.shift();
      location.formatted_address = locationParts.join(' ');
    }
  }

  if (!location.formatted_address) {
    const metaTagPattern = /<meta[^>]*content=['"]([^'"]*\d+°\d+&#39;\d+\.\d+"[^'"]*)['""]/;
    const metaTagMatch = googleResponse.match(metaTagPattern);
    if (metaTagMatch && metaTagMatch[1]) {
      location.formatted_address = metaTagMatch[1].replace(/&#39;/g, "'");
    }
  }

  if (!location.formatted_address) return null;
  return location;
}