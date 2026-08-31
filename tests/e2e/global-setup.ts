import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.test.local" });
loadEnv({ path: ".env.local" });

export default async function globalSetup() {
  const { ensureE2EUsers, resetE2ECoachData } = await import("./fixtures");
  await ensureE2EUsers();
  await resetE2ECoachData();
}
