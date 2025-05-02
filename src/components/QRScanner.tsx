import React, { useState, useRef } from 'react';
import { AlertCircle, Upload, Loader2 } from 'lucide-react';
import { scanQRCode } from '../utils/qrScanner';
import { ScanResult } from '../types';

interface QRScannerProps {
  onScanComplete: (result: ScanResult) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
        console.log("[QRScanner] No file selected.");
        return;
    }
    console.log("[QRScanner] File selected:", file.name, file.type);

    setIsScanning(true);
    setError(null);

    try {
      console.log("[QRScanner] Calling scanQRCode utility...");
      const result = await scanQRCode(file);
      console.log("[QRScanner] scanQRCode result:", result);

      if (result.error) {
        console.warn("[QRScanner] Scan resulted in error:", result.error);
        setError(result.error);
        // Also call onScanComplete with the error result so App knows
        onScanComplete(result);
      } else {
        console.log("[QRScanner] Scan successful, calling onScanComplete.");
        onScanComplete(result);
      }
    } catch (err) {
      console.error("[QRScanner] Unexpected error during scanning process:", err);
      const message = err instanceof Error ? err.message : 'Unknown error scanning QR code';
      setError(message);
      // Report error back to App
      onScanComplete({ data: '', error: message });
    } finally {
      setIsScanning(false);
      // Reset file input to allow scanning the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      console.log("[QRScanner] Scanning process finished.");
    }
  };

  const triggerFileInput = () => {
      fileInputRef.current?.click();
  };

  return (
    <div>
      <div className="flex flex-col items-center">
        <button
          onClick={triggerFileInput}
          className="btn btn-primary flex items-center justify-center gap-2"
          disabled={isScanning}
        >
          {isScanning ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Upload size={18} />
          )}
          {isScanning ? 'Scanning...' : 'Upload QR Image'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*" // Accept common image types
          onChange={handleFileChange}
          className="hidden" // Hide the actual input
          aria-hidden="true"
        />

        {/* Display error message if scanning failed */}
        {error && !isScanning && ( // Only show error when not actively scanning
          <div className="mt-4 flex items-center text-red-500 bg-red-50 p-3 rounded-md">
            <AlertCircle className="mr-2 flex-shrink-0" size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;