// Simple debug utility to help diagnose rendering issues

export const debugLog = (message: string, data?: any): void => {
  // Keep console logging
  const timestamp = new Date().toISOString().substr(11, 12);
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }

  // Remove code that appends to the DOM element
  // const debugElement = document.getElementById("debug-output");
  // if (debugElement) {
  //   const entry = document.createElement("div");
  //   entry.textContent = `[${timestamp}] ${message}`;
  //   debugElement.appendChild(entry);
  // }
};

// Initialize debug environment
export const initDebug = (): void => {
  console.log("Debug mode initialized (overlay removed)");

  // Remove code that creates the debug output element
  // if (!document.getElementById("debug-output")) {
  //   const debugOutput = document.createElement("div");
  //   debugOutput.id = "debug-output";
  //   debugOutput.style.position = "fixed";
  //   debugOutput.style.bottom = "0";
  //   debugOutput.style.right = "0";
  //   debugOutput.style.maxHeight = "200px";
  //   debugOutput.style.overflowY = "auto";
  //   debugOutput.style.backgroundColor = "rgba(0,0,0,0.7)";
  //   debugOutput.style.color = "white";
  //   debugOutput.style.padding = "10px";
  //   debugOutput.style.fontSize = "12px";
  //   debugOutput.style.zIndex = "9999";
  //   document.body.appendChild(debugOutput);
  // }
};