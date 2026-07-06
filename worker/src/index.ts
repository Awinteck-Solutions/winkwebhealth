import "./env";
import { logWorkerEnvStatus } from "./env";
import { connectDb } from "./db";
import { startWorkers, startScheduler } from "./scheduler";

async function main(): Promise<void> {
  logWorkerEnvStatus();
  await connectDb();
  startWorkers();
  await startScheduler();
  console.log(JSON.stringify({ level: "info", message: "WinkWebHealth worker running" }));
}

main().catch((err) => {
  console.error(JSON.stringify({ level: "fatal", error: err.message }));
  process.exit(1);
});
