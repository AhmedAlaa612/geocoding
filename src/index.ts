import app from "./app";
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`   Geocoding API running on http://localhost:${PORT}`);
  console.log(`   GET /geocode?address=<address>[&language=<lang>]`);
  console.log(`   GET /reverse?lat=<lat>&lng=<lng>[&language=<lang>]`);
  console.log(`   GET /health`);
  console.log(`   Swagger UI: http://localhost:${PORT}/docs`);
});

export default app;
