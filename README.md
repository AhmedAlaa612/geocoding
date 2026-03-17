# Geocoding API

A TypeScript + Express REST API wrapping [`@aashari/nodejs-geocoding`](https://github.com/aashari/nodejs-geocoding) to expose forward and reverse geocoding over HTTP.

---

## Setup

```bash
npm install
```

### Run in development

```bash
npm run dev
```

### Build & run for production

```bash
npm run build
npm start
```

The server starts on **port 3000** by default. Override with the `PORT` environment variable:

```bash
PORT=8080 npm start
```

---

## Endpoints

### `GET /geocode` — Address → Coordinates

| Parameter  | Required | Description                          |
| ---------- | -------- | ------------------------------------ |
| `address`  | ✅       | Address string to geocode            |
| `language` | ❌       | BCP-47 language code (default: `en`) |

**Example**

```
GET /geocode?address=Empire+State+Building,+New+York
```

**Response**

```json
{
  "success": true,
  "data": [
    {
      "formatted_address": "Empire State Building, 20 W 34th St, New York, NY 10001, United States",
      "latitude": 40.7484405,
      "longitude": -73.9856644
    }
  ]
}
```

---

### `GET /reverse` — Coordinates → Address

| Parameter  | Required | Description                          |
| ---------- | -------- | ------------------------------------ |
| `lat`      | ✅       | Latitude (-90 to 90)                 |
| `lng`      | ✅       | Longitude (-180 to 180)              |
| `language` | ❌       | BCP-47 language code (default: `en`) |

**Example**

```
GET /reverse?lat=40.7484&lng=-73.9857
```

**Response**

```json
{
  "success": true,
  "data": {
    "latitude": 40.7484,
    "longitude": -73.9857,
    "formatted_address": "Empire State Building, 20 W 34th St, New York, NY 10001, United States",
    "google_plus_code": "87G8Q2M4+96"
  }
}
```

---

### `GET /health`

Returns server health status.

```json
{ "status": "ok", "timestamp": "2026-03-17T10:00:00.000Z" }
```

---

## API Docs (Swagger)

Interactive Swagger UI is available at:

```
GET /docs
```

Raw OpenAPI JSON is available at:

```
GET /openapi.json
```

---

## Deploy to Vercel

This project is Vercel-ready.

1. Push the `geocoding` folder to a Git repository.
2. In Vercel, import the repository and set the **Root Directory** to `geocoding`.
3. Deploy.

The `vercel.json` rewrite routes all incoming requests to the serverless handler at `api/index.ts`, which uses the shared Express app from `src/app.ts`.

Available routes on Vercel include:

- `/geocode`
- `/reverse`
- `/health`
- `/docs`
- `/openapi.json`

---

## Error Responses

All errors follow the same shape:

```json
{
  "success": false,
  "error": "Description of the problem"
}
```

| HTTP Status | Reason                              |
| ----------- | ----------------------------------- |
| `400`       | Missing or invalid query parameters |
| `404`       | No results found                    |
| `500`       | Internal / upstream error           |

---

## Project Structure

```
geocoding-api/
├── api/
│   └── index.ts      # Vercel serverless entrypoint
├── src/
│   ├── app.ts        # Express app (used by local and Vercel)
│   ├── index.ts      # Local server bootstrap (app.listen)
│   ├── openapi.ts    # OpenAPI spec
│   ├── routes.ts     # /geocode and /reverse handlers
│   └── types.ts      # Shared TypeScript interfaces
├── package.json
├── tsconfig.json
├── vercel.json
└── README.md
```

---

> ⚠️ **Note:** The underlying library is intended for non-commercial, low-volume use.  
> For production / commercial workloads use the official [Google Maps Geocoding API](https://developers.google.com/maps/documentation/geocoding/overview).
