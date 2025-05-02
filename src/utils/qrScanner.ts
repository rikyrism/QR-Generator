import jsQR from 'jsqr';
import { ScanResult } from '../types';

export const scanQRCode = (file: File): Promise<ScanResult> => {
  console.log("[scanQRCode] Starting scan for file:", file.name);
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      if (!event.target?.result) {
        console.error("[scanQRCode] FileReader failed to read file.");
        return resolve({ data: '', error: 'Could not read the file' });
      }
      console.log("[scanQRCode] File read successfully by FileReader.");

      const img = new Image();
      img.onload = () => {
        console.log("[scanQRCode] Image loaded successfully. Dimensions:", img.width, "x", img.height);
        // Create a canvas element to draw the image
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true }); // Opt-in for performance

        if (!context) {
          console.error("[scanQRCode] Could not create canvas context.");
          return resolve({ data: '', error: 'Could not create canvas context' });
        }

        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image to canvas
        context.drawImage(img, 0, 0);
        console.log("[scanQRCode] Image drawn onto canvas.");

        try {
            // Get image data for QR code processing
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            console.log("[scanQRCode] Got ImageData from canvas.");

            // Process with jsQR
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
              console.log("[scanQRCode] jsQR found code:", code);
              console.log("[scanQRCode] Decoded data:", code.data);
              resolve({ data: code.data, format: 'QR_CODE' }); // Assuming QR format
            } else {
              console.warn("[scanQRCode] jsQR did not find any QR code in the image.");
              resolve({ data: '', error: 'No QR code found in the image' });
            }
        } catch (err) {
             console.error("[scanQRCode] Error during canvas getImageData or jsQR processing:", err);
             resolve({ data: '', error: 'Error processing image data for QR scan' });
        }
      };

      img.onerror = () => {
        console.error("[scanQRCode] Failed to load image from data URL.");
        resolve({ data: '', error: 'Failed to load the image' });
      };

      // Set image source from the file reader result
      img.src = event.target.result as string;
      console.log("[scanQRCode] Set image source for processing.");
    };

    reader.onerror = () => {
      console.error("[scanQRCode] FileReader error occurred.");
      resolve({ data: '', error: 'Error reading the file' });
    };

    // Read the file as a data URL
    reader.readAsDataURL(file);
    console.log("[scanQRCode] Initiated FileReader readAsDataURL.");
  });
};