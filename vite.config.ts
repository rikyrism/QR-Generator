import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import express from "express";
import bodyParser from "body-parser";
import QRCode from "qrcode";

// CRC16 implementation (Matches PHP reference)
function crc16(str: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc <<= 1;
      }
    }
  }

  crc &= 0xffff;
  let hex = crc.toString(16).toUpperCase();
  // Pad with leading zero if necessary (like PHP's sprintf)
  while (hex.length < 4) {
    hex = "0" + hex;
  }
  return hex;
}

// Function to process QRIS string based on PHP reference logic (Strictly)
function processQRIS(
  qris: string,
  qty: string, // Amount
  serviceFee: boolean,
  feeType: string, // 'r' for fixed (rupiah), 'p' for percentage
  feeValue: string // The fixed amount or percentage value
  // No customMerchantName parameter
): string {
  console.log("--- Processing QRIS (Strict PHP Logic) ---");
  console.log("Original QRIS:", qris);
  console.log("Amount (qty):", qty);
  console.log("Service Fee:", serviceFee);
  console.log("Fee Type:", feeType);
  console.log("Fee Value:", feeValue);

  // Basic validation
  if (!qris || qris.length < 10) {
    throw new Error("Invalid base QRIS string format (too short).");
  }
  if (!/^\d+$/.test(qty) || Number(qty) <= 0) {
    throw new Error("Invalid amount. Must be a positive integer.");
  }
  if (serviceFee && (!feeValue || !/^\d+(\.\d+)?$/.test(feeValue) || Number(feeValue) < 0)) {
    throw new Error("Invalid fee value. Must be a non-negative number.");
  }

  // 1. Remove last 4 chars (assumed CRC value) - PHP logic
  let qrisBase = qris.slice(0, -4);
  console.log("Base after CRC removal:", qrisBase);

  // 2. Change Point of Initiation Method (Tag 01) from '11' to '12' - PHP logic
  const staticPOI = "010211";
  const dynamicPOI = "010212";
  if (qrisBase.includes(staticPOI)) {
    qrisBase = qrisBase.replace(staticPOI, dynamicPOI);
    console.log("POI changed to dynamic (12).");
  } else if (!qrisBase.includes(dynamicPOI)) {
    console.warn("Static POI (010211) not found, and dynamic POI (010212) not present either. Assuming malformed or already dynamic.");
  } else {
    console.log("POI is already dynamic (12).");
  }

  // 3. Split the string at the Country Code Tag (5802ID) - PHP logic
  const countryCodeTag = "5802ID";
  const parts = qrisBase.split(countryCodeTag);
  if (parts.length !== 2) {
    throw new Error("Could not find Country Code Tag '5802ID' to determine insertion point.");
  }
  console.log("Split parts:", parts);

  // 4. Prepare Amount Field (Tag 54) - PHP logic
  const amountValue = qty;
  const amountLength = amountValue.length.toString().padStart(2, "0");
  const amountField = "54" + amountLength + amountValue;
  console.log("Amount Field (54):", amountField);

  // 5. Prepare Fee Fields (Tags 55, 56/57) if applicable - PHP logic
  let feeFields = ""; // Renamed from $tax in PHP
  if (serviceFee && feeValue && Number(feeValue) >= 0) {
    const feeValStr = feeValue;
    const feeLength = feeValStr.length.toString().padStart(2, "0");

    if (feeType === "p") {
      // Percentage
      feeFields = "550203" + "57" + feeLength + feeValStr;
      console.log("Fee Fields (Percentage - 55 + 57):", feeFields);
    } else {
      // Fixed ('r')
      feeFields = "550202" + "56" + feeLength + feeValStr;
      console.log("Fee Fields (Fixed - 55 + 56):", feeFields);
    }
  }

  // 6. Reconstruct the string - PHP logic
  // Combine amount, fee (if any), and the country code tag
  let combinedMiddlePart = amountField + feeFields + countryCodeTag;
  // Concatenate parts
  let finalBaseString = parts[0] + combinedMiddlePart + parts[1];
  console.log("Reconstructed Base String (before CRC):", finalBaseString);

  // 7. Recalculate CRC16 - PHP logic
  const newCRC = crc16(finalBaseString);
  console.log("Calculated New CRC:", newCRC);

  // 8. Final QRIS String - Append ONLY the CRC hex value - PHP logic
  const finalQRIS = finalBaseString + newCRC;
  console.log("Final Dynamic QRIS:", finalQRIS);
  console.log("--- End Processing ---");

  return finalQRIS;
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "configure-server",
      configureServer(server) {
        server.middlewares.use(bodyParser.json());

        // API endpoint for QRIS generation
        server.middlewares.use("/api/generate", (req, res) => {
          if (req.method === "POST") {
            try {
              // Destructure without customMerchantName
              const { qris, qty, service_fee, fee_type, fee_value } = req.body;

              if (!qris || !qty) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(
                  JSON.stringify({
                    status: "error",
                    message: "QRIS string and quantity are required",
                  })
                );
              }

              // Process QRIS string using the reverted function
              const qrisString = processQRIS(qris, qty, service_fee, fee_type, fee_value);

              // Generate QR code image
              QRCode.toDataURL(qrisString, { errorCorrectionLevel: "M", width: 300 })
                .then((qrisDataURL) => {
                  res.writeHead(200, { "Content-Type": "application/json" });
                  res.end(
                    JSON.stringify({
                      status: "success",
                      qrisString,
                      qrisBase64: qrisDataURL.split(",")[1],
                    })
                  );
                })
                .catch((err) => {
                  console.error("QRCode generation error:", err);
                  res.writeHead(500, { "Content-Type": "application/json" });
                  res.end(
                    JSON.stringify({
                      status: "error",
                      message: "Failed to generate QR code image",
                      error: err.message,
                    })
                  );
                });
            } catch (error) {
              console.error("QRIS processing error:", error);
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  status: "error",
                  message: error instanceof Error ? error.message : "Unknown error processing QRIS string",
                })
              );
            }
          } else {
            res.writeHead(405, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "error", message: "Method not allowed" }));
          }
        });
      },
    },
  ],
  server: {
    port: 3001,
    allowedHosts: [".ngrok-free.app"],
  },
});
