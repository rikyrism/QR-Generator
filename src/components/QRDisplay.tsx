import React, { useState } from "react";
import { Copy, CheckCircle, XCircle, Download } from "lucide-react";
import { QRISResult } from "../types";

interface QRDisplayProps {
  result: QRISResult;
}

const QRDisplay: React.FC<QRDisplayProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (result.qrisString) {
      try {
        await navigator.clipboard.writeText(result.qrisString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  const downloadQRCode = () => {
    if (result.qrisBase64) {
      const link = document.createElement("a");
      link.href = result.qrisBase64;
      link.download = `qris-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (result.status === "error") {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-md">
        <XCircle className="flex-shrink-0" size={20} />
        <span>{result.message || "Failed to generate QR code"}</span>
      </div>
    );
  }

  if (!result.qrisBase64) {
    return null;
  }

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 max-w-xs">
        <img src={result.qrisBase64} alt="Generated QR Code" className="w-full h-auto" />
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={downloadQRCode} className="btn btn-primary flex items-center gap-2">
          <Download size={18} />
          Download QR Code
        </button>
        <button
          onClick={copyToClipboard}
          // Changed from btn-secondary to btn-primary to match the Scan QR button style
          className="btn btn-primary flex items-center gap-2"
        >
          {copied ? (
            <>
              <CheckCircle size={18} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={18} />
              Copy String
            </>
          )}
        </button>
      </div>

      {result.qrisString && (
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">QRIS String:</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-md overflow-x-auto">
            <code className="text-xs break-all">{result.qrisString}</code>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRDisplay;
