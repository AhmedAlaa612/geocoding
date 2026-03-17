import { Router, Request, Response } from "express";
import * as geocoding from "@aashari/nodejs-geocoding";
import { ApiResponse } from "./types";
import { decodeLocation } from './utils';
const router = Router();

/**
 * GET /geocode
 * Convert an address to geographic coordinates.
 *
 * Query params:
 *   address  (required) - The address to geocode, e.g. "Empire State Building, New York"
 *   language (optional) - BCP-47 language code, defaults to "en"
 *
 * Example: GET /geocode?address=Eiffel+Tower&language=fr
 */
router.get("/geocode", async (req: Request, res: Response) => {
  const address =
    typeof req.query.address === "string" ? req.query.address : "";
  const language =
    typeof req.query.language === "string" ? req.query.language : "en";

  if (!address || address.trim() === "") {
    const response: ApiResponse<null> = {
      success: false,
      error: "Missing required query parameter: address",
    };
    return res.status(400).json(response);
  }

  try {
    const results = await geocoding.encode(address.trim(), language);

    if (!results || results.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        error: `No results found for address: "${address}"`,
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof results> = {
      success: true,
      data: results.map(decodeLocation),
    };
    return res.status(200).json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Geocoding failed";
    const response: ApiResponse<null> = { success: false, error: message };
    return res.status(500).json(response);
  }
});

/**
 * GET /reverse
 * Convert geographic coordinates to a human-readable address.
 *
 * Query params:
 *   lat      (required) - Latitude,  e.g. 40.7484
 *   lng      (required) - Longitude, e.g. -73.9857
 *   language (optional) - BCP-47 language code, defaults to "en"
 *
 * Example: GET /reverse?lat=40.7484&lng=-73.9857
 */
router.get("/reverse", async (req: Request, res: Response) => {
  const lat = typeof req.query.lat === "string" ? req.query.lat : "";
  const lng = typeof req.query.lng === "string" ? req.query.lng : "";
  const language =
    typeof req.query.language === "string" ? req.query.language : "en";

  if (!lat || !lng) {
    const response: ApiResponse<null> = {
      success: false,
      error: "Missing required query parameters: lat and lng",
    };
    return res.status(400).json(response);
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    const response: ApiResponse<null> = {
      success: false,
      error: "lat and lng must be valid numbers",
    };
    return res.status(400).json(response);
  }

  if (latitude < -90 || latitude > 90) {
    const response: ApiResponse<null> = {
      success: false,
      error: "lat must be between -90 and 90",
    };
    return res.status(400).json(response);
  }

  if (longitude < -180 || longitude > 180) {
    const response: ApiResponse<null> = {
      success: false,
      error: "lng must be between -180 and 180",
    };
    return res.status(400).json(response);
  }

  try {
    const result = await geocoding.decode(latitude, longitude, language);

    if (!result) {
      const response: ApiResponse<null> = {
        success: false,
        error: `No address found for coordinates: (${latitude}, ${longitude})`,
      };
      return res.status(404).json(response);
    }

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    };
    return res.status(200).json(response);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Reverse geocoding failed";
    const response: ApiResponse<null> = { success: false, error: message };
    return res.status(500).json(response);
  }
});

export default router;
