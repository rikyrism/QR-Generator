// Global type declarations

// Fix for missing __WS_TOKEN__ error
declare global {
  var __WS_TOKEN__: string | undefined;

  // Add window.ethereum type (if needed)
  interface Window {
    ethereum?: any;
  }
}

export {};
