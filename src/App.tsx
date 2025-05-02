import React, { useState } from 'react';
import QRScanner from './components/QRScanner';
import QRForm from './components/QRForm'; // Ensure this uses the reverted version (no custom name)
import QRDisplay from './components/QRDisplay';
import { QRISData, QRISResult, ScanResult } from './types'; // Ensure this uses the base QRISData
import { Scan, Loader2 } from 'lucide-react'; // Import Loader2

function App() {
  const [scanResult, setScanResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QRISResult | null>(null);

  const handleScanComplete = (scanData: ScanResult) => { // Renamed parameter for clarity
    if (scanData.data) {
      setScanResult(scanData.data);
      setResult(null); // Clear previous result
      console.log("Scan complete, QRIS data:", scanData.data); // Add log
    } else if (scanData.error) { // Handle scan error case
        console.error("Scan error:", scanData.error);
        setResult({ status: 'error', message: `Scan Error: ${scanData.error}` });
    }
  };

  // Using the handleGenerateQR logic provided by the user
  const handleGenerateQR = async (data: QRISData) => {
    setLoading(true);
    setResult(null); // Clear previous result before generating
    console.log("Generating QR with data:", data); // Log data being sent
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data), // Send base QRISData
      });

      // Check if response is ok before parsing
      if (!response.ok) {
          // Try to get error message from response body, fallback to status text
          let errorMessage = `HTTP error! Status: ${response.status}`;
          try {
              const errorResult = await response.json();
              errorMessage = errorResult.message || errorResult.error || errorMessage;
          } catch (e) {
              // Ignore if response body is not JSON or empty
          }
          throw new Error(errorMessage);
      }

      const apiResult: QRISResult = await response.json(); // Use QRISResult type
      console.log("API Response:", apiResult); // Log API response

      // Add base64 prefix if generation was successful
      if (apiResult.status === 'success' && apiResult.qrisBase64) {
        const prefix = 'data:image/png;base64,';
         // Check if prefix already exists before adding
        if (!apiResult.qrisBase64.startsWith(prefix)) {
            apiResult.qrisBase64 = prefix + apiResult.qrisBase64;
        }
      }
      setResult(apiResult); // Set result regardless of success/error from API

    } catch (error) {
      console.error("Error during fetch or processing:", error); // Log the caught error
      setResult({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to generate QR code due to an unexpected error.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">QRIS Generator</h1>
        <p className="text-gray-600">Upload a static QRIS code to generate a dynamic one</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* QR Scanner Section */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Scan className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold">Scan QR Code</h2>
          </div>
          <QRScanner onScanComplete={handleScanComplete} />
          {scanResult && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Scanned QRIS:</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <code className="text-xs break-all">{scanResult}</code>
              </div>
            </div>
          )}
        </div>

        {/* QR Form Section */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Generate Dynamic QRIS</h2>
          {scanResult ? (
            <QRForm
              qrisString={scanResult}
              onSubmit={handleGenerateQR}
              loading={loading}
            />
          ) : (
            <div className="text-center text-gray-500 py-8">
              Please scan a QRIS code first
            </div>
          )}
        </div>
      </div>

      {/* Result Display Section - Conditionally render based on result and loading state */}
       {loading && (
         <div className="flex justify-center items-center mt-8 text-gray-600">
           <Loader2 className="animate-spin mr-2" size={24} />
           <span>Generating QR Code... Please wait.</span>
         </div>
       )}
      {result && !loading && ( // Only show result card when not loading
        <div className="card mt-8">
           <h2 className="text-xl font-semibold mb-4 text-center">Generated QR Code</h2>
          <QRDisplay result={result} />
        </div>
      )}
    </div>
  );
}

export default App;