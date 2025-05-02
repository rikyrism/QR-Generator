import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

/**
 * Kill processes that might be locking build tools
 */
async function killBuildProcesses() {
  try {
    console.log("Attempting to terminate build processes...");

    // Try to kill both esbuild and any node processes that might be holding locks
    try {
      await execAsync("taskkill /f /im esbuild.exe", { windowsHide: true });
      console.log("Successfully terminated esbuild processes");
    } catch (error) {
      // It's okay if there are no processes to kill
      console.log("No esbuild processes were running or already terminated");
    }

    // Also try to release rollup processes - they run under Node
    try {
      // This will find node processes and check if they're running rollup
      const { stdout } = await execAsync("wmic process where \"caption='node.exe'\" get commandline,processid");

      // Parse output to find PIDs of node processes running rollup
      const lines = stdout.split("\n");
      for (const line of lines) {
        if (line.includes("rollup")) {
          const pidMatch = line.match(/(\d+)$/);
          if (pidMatch && pidMatch[1]) {
            const pid = pidMatch[1];
            await execAsync(`taskkill /F /PID ${pid}`);
            console.log(`Terminated rollup process with PID ${pid}`);
          }
        }
      }
    } catch (error) {
      console.log("No rollup processes found or could not terminate them");
    }

    console.log("Process termination attempts completed");
  } catch (error) {
    console.error("Error during process cleanup:", error);
  }
}

/**
 * Wait a moment for file locks to clear
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function cleanup() {
  await killBuildProcesses();

  // Wait a bit to make sure the processes have fully terminated
  await delay(1000);

  console.log("Cleanup complete");
}

// Allow running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cleanup().catch(console.error);
}
