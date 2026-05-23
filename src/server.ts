import { env } from "./config/env.js";
import { buildApp } from "./http/app.js";

const app = await buildApp();

const shutdown = async (): Promise<void> => {
  await app.close();
};

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

await app.listen({
  host: env.HOST,
  port: env.PORT
});
