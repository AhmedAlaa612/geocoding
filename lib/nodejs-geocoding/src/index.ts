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
	/**
	 * BCP-47 language code for results (e.g. 'en', 'ar', 'fr').
	 * @default 'en'
	 */
	language?: string;

	/**
	 * ISO 3166-1 alpha-2 country code to bias results toward a specific country.
	 * Mirrors the `gl` parameter Google Maps sends from the browser.
	 * Example: 'eg' for Egypt, 'us' for United States, 'fr' for France.
	 */
	countryCode?: string;

	/**
	 * Bounding box to bias results toward a specific region.
	 * Results inside the box are ranked higher; results outside are not excluded.
	 */
	bounds?: {
		sw: { lat: number; lng: number };
		ne: { lat: number; lng: number };
	};

	/**
	 * The center point of the viewport used for proximity ranking.
	 * Defaults to the center of `bounds` if not provided.
	 * Pass the user's actual device coordinates here for best results —
	 * Google will rank results closest to this point first.
	 */
	viewportCenter?: {
		lat: number;
		lng: number;
	};
}

export async function encode(
	formattedAddress: string,
	languageOrOptions: string | EncodeOptions = 'en',
): Promise<Location[]> {

	// Support both old encode(address, 'en') and new encode(address, { ... })
	const options: EncodeOptions =
		typeof languageOrOptions === 'string'
			? { language: languageOrOptions }
			: languageOrOptions;

	const language = options.language ?? 'en';
	const countryCode = options.countryCode ?? '';
	const bounds = options.bounds;
	const viewportCenter = options.viewportCenter;

	// Determine the center to inject into the pb= viewport blob:
	//   1. Explicit viewportCenter (user's device coordinates) — best
	//   2. Center of bounds — good fallback
	//   3. 0,0 — original library default (server location dependent)
	let centerLat = 0;
	let centerLng = 0;

	if (viewportCenter) {
		centerLat = viewportCenter.lat;
		centerLng = viewportCenter.lng;
	} else if (bounds) {
		centerLat = (bounds.sw.lat + bounds.ne.lat) / 2;
		centerLng = (bounds.sw.lng + bounds.ne.lng) / 2;
	}

	// Replace the hardcoded !2d0!3d0 viewport center in the pb= blob
	// with our computed center. !2d = longitude, !3d = latitude.
	const pb = '!2i15!4m12!1m3!1d39925620.84463408!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1015!2i939!4f13.1!7i20!10b1!12m8!1m1!18b1!2m3!5m1!6e2!20e3!10b1!16b1!19m4!2m3!1i360!2i120!4i8!20m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240!7m42!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e9!2b1!3e2!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!2b1!4b1!9b0!22m3!1s_lJEYqe4D8_F4-EP4o-HoAM!3b1!7e81!23m2!4b1!10b1!24m65!1m21!13m8!2b1!3b1!4b1!6i1!8b1!9b1!14b1!20b1!18m11!3b1!4b1!5b1!6b1!9b1!12b1!13b1!14b1!15b1!17b1!20b1!2b1!5m5!2b1!3b1!5b1!6b1!7b1!10m1!8e3!14m1!3b1!17b1!20m2!1e3!1e6!24b1!25b1!26b1!29b1!30m1!2b1!36b1!43b1!52b1!54m1!1b1!55b1!56m2!1b1!3b1!65m5!3m4!1m3!1m2!1i224!2i298!71b1!72m4!1m2!3b1!5b1!4b1!89b1!26m4!2m3!1i80!2i92!4i8!34m17!2b1!3b1!4b1!6b1!8m5!1b1!3b1!4b1!5b1!6b1!9b1!12b1!14b1!20b1!23b1!25b1!26b1!37m1!1e81!47m0!49m5!3b1!6m1!1b1!7m1!1e3!67m2!7b1!10b1!69i596'
		.replace('!2d0!3d0', `!2d${centerLng}!3d${centerLat}`);

	const glParam = countryCode ? `&gl=${encodeURIComponent(countryCode)}` : '';
	const url = `https://www.google.com/s?gs_ri=maps&authuser=0&hl=${language}${glParam}&pb=${pb}&q=${encodeURI(formattedAddress)}`;

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

	return locationList.filter(
		(location): location is Location => location !== null,
	);
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