import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import nextEnv from "@next/env";

const appDir = process.cwd();
const { loadEnvConfig } = nextEnv;

// Standalone server.js does not load .env files by itself.
loadEnvConfig(appDir, false);
process.env.NODE_ENV = "production";
process.env.PORT ||= "3010";
process.env.HOSTNAME ||= "127.0.0.1";

// Prisma resolves relative SQLite URLs from the generated client directory in
// standalone builds. Rebase the project convention `file:./dev.db` to prisma/.
const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl?.startsWith("file:./")) {
  const relativePath = databaseUrl.slice("file:./".length);
  const absolutePath = path
    .resolve(appDir, "prisma", relativePath)
    .split(path.sep)
    .join("/");
  process.env.DATABASE_URL = `file:${absolutePath}`;
}

const standaloneDir = path.join(appDir, ".next", "standalone");
const serverPath = path.join(standaloneDir, "server.js");
if (!fs.existsSync(serverPath)) {
  throw new Error("standalone_build_missing: run `npm run build` first");
}

function copyRuntimeAssets(source, destination) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true, force: true });
}

copyRuntimeAssets(
  path.join(appDir, ".next", "static"),
  path.join(standaloneDir, ".next", "static")
);
copyRuntimeAssets(
  path.join(appDir, "public"),
  path.join(standaloneDir, "public")
);

await import(pathToFileURL(serverPath).href);
