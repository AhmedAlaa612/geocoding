import express, { Request, Response, NextFunction } from "express";
import routes from "./routes";
import openApiSpec from "./openapi";

const app = express();
app.set("trust proxy", true);

const SWAGGER_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Geocoding API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis],
    });
  </script>
</body>
</html>`;

app.use(express.json());

app.use("/", routes);

app.get("/openapi.json", (req: Request, res: Response) => {
  const host = req.get("host");
  const protocol = req.protocol;
  const serverUrl = host ? `${protocol}://${host}` : "http://localhost:3000";

  res.json({
    ...openApiSpec,
    servers: [
      {
        url: serverUrl,
        description: "Current deployment",
      },
    ],
  });
});

app.get("/docs", (_req: Request, res: Response) => {
  res.type("html").send(SWAGGER_HTML);
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Unhandled error]", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

export default app;
