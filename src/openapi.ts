const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Geocoding API",
    version: "1.0.0",
    description:
      "REST API for forward and reverse geocoding using @aashari/nodejs-geocoding.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development server",
    },
  ],
  tags: [{ name: "Geocoding" }, { name: "Health" }],
  paths: {
    "/geocode": {
      get: {
        tags: ["Geocoding"],
        summary: "Convert an address to coordinates",
        parameters: [
          {
            name: "address",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Address string to geocode",
          },
          {
            name: "language",
            in: "query",
            required: false,
            schema: { type: "string", default: "en" },
            description: "BCP-47 language code",
          },
          {
            name: "bias",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["true", "false"], default: "true" },
            description: "Restrict results to Alexandria. Set to false to search globally.",
          },
          {
            name: "user_lat",
            in: "query",
            required: false,
            schema: { type: "number" },
            description: "User's latitude for proximity-aware ranking within Alexandria.",
          },
          {
            name: "user_lng",
            in: "query",
            required: false,
            schema: { type: "number" },
            description: "User's longitude for proximity-aware ranking within Alexandria.",
          },
        ],
        responses: {
          "200": {
            description: "Geocoding results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          formatted_address: { type: "string" },
                          latitude: { type: "number" },
                          longitude: { type: "number" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Missing or invalid query parameters",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "No results found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/reverse": {
      get: {
        tags: ["Geocoding"],
        summary: "Convert coordinates to an address",
        parameters: [
          {
            name: "lat",
            in: "query",
            required: true,
            schema: { type: "number", format: "double" },
            description: "Latitude between -90 and 90",
          },
          {
            name: "lng",
            in: "query",
            required: true,
            schema: { type: "number", format: "double" },
            description: "Longitude between -180 and 180",
          },
          {
            name: "language",
            in: "query",
            required: false,
            schema: { type: "string", default: "en" },
            description: "BCP-47 language code",
          },
          {
            name: "bias",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["true", "false"], default: "true" },
            description: "Reject coordinates outside Alexandria. Set to false to allow global coordinates.",
          }
        ],
        responses: {
          "200": {
            description: "Reverse geocoding result",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        latitude: { type: "number" },
                        longitude: { type: "number" },
                        formatted_address: { type: "string" },
                        google_plus_code: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Missing or invalid query parameters",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "No result found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/health": {
      get: {
        tags: ["Health"],
        summary: "API health check",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string", example: "Description of the problem" },
        },
        required: ["success", "error"],
      },
    },
  },
} as const;

export default openApiSpec;
