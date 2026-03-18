import { Router, Request, Response } from "express";
import { decode } from "../lib/nodejs-geocoding/src/index";
import { ApiResponse } from "./types";
import { decodeLocation, isInAlexandria } from "./utils";
import { geocodeWithBias } from "./geocode";

const router = Router();

/**
 * GET /geocode
 * Query params:
 *   address   (required)
 *   language  (optional) default: "en"
 *   bias      (optional) default: "true" — restrict to Alexandria
 *   user_lat  (optional) — user's latitude for proximity ranking
 *   user_lng  (optional) — user's longitude for proximity ranking
 */
router.get("/geocode", async (req: Request, res: Response) => {
  const address = typeof req.query.address === "string" ? req.query.address : "";
  const language = typeof req.query.language === "string" ? req.query.language : "en";
  const biasAlexandria = req.query.bias !== "false";

  const rawUserLat = typeof req.query.user_lat === "string" ? req.query.user_lat : undefined;
  const rawUserLng = typeof req.query.user_lng === "string" ? req.query.user_lng : undefined;

  if (!address || address.trim() === "") {
    return res.status(400).json({ success: false, error: "Missing required query parameter: address" });
  }

  let userLat: number | undefined;
  let userLng: number | undefined;

  if (rawUserLat !== undefined && rawUserLng !== undefined) {
    userLat = parseFloat(rawUserLat);
    userLng = parseFloat(rawUserLng);
    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ success: false, error: "user_lat and user_lng must be valid numbers" });
    }
  }

  try {
    const results = await geocodeWithBias(address.trim(), language, biasAlexandria, userLat, userLng);

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No results found${biasAlexandria ? " within Alexandria" : ""} for: "${address}"${biasAlexandria ? ". Use ?bias=false to search globally." : ""}`,
      });
    }

    const response: ApiResponse<typeof results> = { success: true, data: results };
    return res.status(200).json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Geocoding failed";
    return res.status(500).json({ success: false, error: message });
  }
});

/**
 * GET /reverse
 * Query params:
 *   lat      (required)
 *   lng      (required)
 *   language (optional) default: "en"
 *   bias     (optional) default: "true" — reject coords outside Alexandria
 */
router.get("/reverse", async (req: Request, res: Response) => {
  const lat = typeof req.query.lat === "string" ? req.query.lat : "";
  const lng = typeof req.query.lng === "string" ? req.query.lng : "";
  const language = typeof req.query.language === "string" ? req.query.language : "en";
  const biasAlexandria = req.query.bias !== "false";

  if (!lat || !lng) {
    return res.status(400).json({ success: false, error: "Missing required query parameters: lat and lng" });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ success: false, error: "lat and lng must be valid numbers" });
  }
  if (latitude < -90 || latitude > 90) {
    return res.status(400).json({ success: false, error: "lat must be between -90 and 90" });
  }
  if (longitude < -180 || longitude > 180) {
    return res.status(400).json({ success: false, error: "lng must be between -180 and 180" });
  }
  if (biasAlexandria && !isInAlexandria({ latitude, longitude })) {
    return res.status(400).json({
      success: false,
      error: `Coordinates (${latitude}, ${longitude}) are outside Alexandria. Use ?bias=false to search globally.`,
    });
  }

  try {
    const result = await decode(latitude, longitude, language);

    if (!result) {
      return res.status(404).json({ success: false, error: `No address found for coordinates: (${latitude}, ${longitude})` });
    }

    return res.status(200).json({ success: true, data: decodeLocation(result) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reverse geocoding failed";
    return res.status(500).json({ success: false, error: message });
  }
});

export default router;