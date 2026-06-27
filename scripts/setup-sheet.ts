import { config } from "dotenv";
import { ensureSheetTabs } from "../src/lib/sheets/client";

config({ path: ".env.local" });

async function main() {
  console.log("Initializing Google Sheet tabs...");
  await ensureSheetTabs();
  console.log("Done! Sheet is ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
