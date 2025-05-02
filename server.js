import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "dist")));

// API endpoint for QR code generation
app.post("/api/generate", (req, res) => {
  try {
    console.log("Received QR generation request:", req.body);

    // For testing, return a dummy success response
    res.json({
      status: "success",
      message: "QR code generated successfully",
      qrisBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", // Simple 1x1 transparent PNG
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    res.status(500).json({
      status: "error",
      message: error.message || "Internal server error",
    });
  }
});

// All other GET requests not handled will return the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
