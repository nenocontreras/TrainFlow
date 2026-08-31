import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.test.local" });
loadEnv({ path: ".env.local" });

export default async function globalSetup() {
  const { ensureE2EUsers } = await import("./fixtures");
  await ensureE2EUsers();
}
