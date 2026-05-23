import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().min(1).default("0.0.0.0"),
  REDIS_HOST: z.string().min(1).default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  META_API_URL: z
    .string()
    .url()
    .default("https://jsonplaceholder.typicode.com/posts/1"),
  META_API_TIMEOUT_MS: z.coerce.number().int().positive().default(5000)
});

export const env = envSchema.parse(process.env);
