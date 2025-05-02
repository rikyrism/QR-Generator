import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initDebug, debugLog } from "./utils/debug";

// Initialize debugging
if (import.meta.env.DEV) {
  initDebug();
  debugLog("Application starting up...");
}

// Add error handling for render failures
try {
  const rootElement = document.getElementById("root");

  if (rootElement) {
    debugLog("Root element found, rendering app...");
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } else {
    console.error("Root element not found in DOM!");
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: sans-serif;">
        <h2>Application Error</h2>
        <p>Could not find root element to mount application.</p>
        <p style="color: #666;">Check HTML structure and make sure there's a div with id="root"</p>
      </div>
    `;
  }
} catch (error) {
  console.error("Failed to render application:", error);
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: sans-serif;">
      <h2>Application Failed to Start</h2>
      <p>There was a problem initializing the application.</p>
      <pre style="background: #f5f5f5; padding: 10px; text-align: left; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
    </div>
  `;
}
