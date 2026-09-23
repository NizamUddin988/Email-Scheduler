import { app } from "./app.js";
import { config } from "./config.js";
import { connectDatabase } from "./db.js";

await connectDatabase();

const server = app.listen(config.port, () => {
  console.log(`API running at http://localhost:${config.port}`);
});

async function shutdown(signal) {
  console.log(`${signal}: shutting down API...`);
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
