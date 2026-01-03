import { defineConfig } from "@prisma/config";
import dotenv from "dotenv";
import path from "path";

// Load .env from same folder as this config file so DATABASE_URL is available
dotenv.config({ path: path.join(__dirname, ".env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
