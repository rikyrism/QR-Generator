const { app } = require("electron");
const { exec } = require("child_process");
const path = require("path");

function restartElectronApp() {
  console.log("Restarting Electron application...");

  // Execute the cleanup script
  const cleanup = exec("npm run cleanup", {
    cwd: path.join(__dirname, ".."),
  });

  cleanup.stdout.on("data", (data) => console.log(data.toString().trim()));
  cleanup.stderr.on("data", (data) => console.error(data.toString().trim()));

  cleanup.on("exit", () => {
    console.log("Cleanup completed, restarting app...");
    app.relaunch();
    app.exit(0);
  });
}

module.exports = { restartElectronApp };
