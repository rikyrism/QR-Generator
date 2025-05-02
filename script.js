document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const qrisImageInput = document.getElementById("qris-image");
  const qrisCodeField = document.getElementById("qris-code");
  const amountField = document.getElementById("amount");
  const merchantNameField = document.getElementById("merchant-name");
  const addFeeCheckbox = document.getElementById("add-fee");
  const feeOptionsDiv = document.getElementById("fee-options");
  const feeTypeSelect = document.getElementById("fee-type");
  const feeValueField = document.getElementById("fee-value");
  const generateBtn = document.getElementById("generate-btn");
  const resultCard = document.getElementById("result-card");
  const qrImageContainer = document.getElementById("qr-image-container");
  const generatedQrisCode = document.getElementById("generated-qris-code");
  const downloadBtn = document.getElementById("download-btn");
  const copyBtn = document.getElementById("copy-btn");
  const resetStatsBtn = document.getElementById("reset-stats-btn"); // Get reset button
  const statsContainer = document.querySelector(".stats-container"); // Get stats container
  const merchantTitleEl = document.querySelector(".merchant-title-container"); // Get merchant title element

  // Camera scanning elements
  const cameraScanBtn = document.getElementById("camera-scan");
  const scannerContainer = document.getElementById("scanner-container");
  const stopScanBtn = document.getElementById("stop-scan");

  // HTML5 QR Scanner instance
  let html5QrScanner = null;

  // Statistics Elements
  const totalTransactionsEl = document.getElementById("total-transactions");
  const totalValueEl = document.getElementById("total-value");
  const averageValueEl = document.getElementById("average-value");

  // Theme toggle element
  const themeToggle = document.getElementById("theme-toggle");

  // Initialize theme based on local storage or system preference
  initializeTheme();

  // Theme toggle event listener
  themeToggle.addEventListener("click", function () {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  });

  // Function to initialize theme
  function initializeTheme() {
    // Check if user has previously selected a theme
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
      // Apply saved theme
      setTheme(savedTheme);
    } else {
      // Check if user prefers dark mode
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
      } else {
        setTheme("light");
      }
    }

    // Set toggle position based on current theme
    themeToggle.checked = document.documentElement.getAttribute("data-theme") === "dark";

    // Listen for system theme changes
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (!localStorage.getItem("theme")) {
        setTheme(e.matches ? "dark" : "light");
        themeToggle.checked = e.matches;
      }
    });
  }

  // Function to set theme
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    themeToggle.checked = theme === "dark";
  }

  // Transaction tracking
  let transactionData = JSON.parse(localStorage.getItem("transactionData")) || {};
  let currentMerchantOriginalName = null; // Track the currently displayed merchant's original name
  // updateTransactionStats(); // Remove initial call, stats are shown per merchant

  // Event Listeners
  qrisImageInput.addEventListener("change", handleQRISImageUpload);
  cameraScanBtn.addEventListener("click", startCameraScanning);
  stopScanBtn.addEventListener("click", stopCameraScanning);
  addFeeCheckbox.addEventListener("change", toggleFeeOptions);
  feeTypeSelect.addEventListener("change", updateFeeLabel);
  generateBtn.addEventListener("click", generateDynamicQRIS);
  downloadBtn.addEventListener("click", downloadQRCode);
  copyBtn.addEventListener("click", copyQRISString);
  resetStatsBtn.addEventListener("click", resetTransactionStats); // Add listener for reset button

  // --- AWAL: Modal Element References ---
  const resetModal = document.getElementById("resetConfirmationModal");
  const resetConfirmationMessage = document.getElementById("resetConfirmationMessage");
  const confirmResetBtn = document.getElementById("confirmResetBtn");
  const cancelResetBtn = document.getElementById("cancelResetBtn");
  const modalCloseBtn = resetModal.querySelector(".modal-close-btn");
  // --- AKHIR: Modal Element References ---

  // --- AWAL: Event Listeners untuk Modal ---
  if (confirmResetBtn) {
    confirmResetBtn.addEventListener("click", () => {
      executeReset();
      closeResetModal();
    });
  }

  if (cancelResetBtn) {
    cancelResetBtn.addEventListener("click", closeResetModal);
  }

  if (resetModal) {
    resetModal.addEventListener("click", (event) => {
      if (event.target === resetModal) {
        closeResetModal();
      }
    });
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeResetModal);
  }
  // --- AKHIR: Event Listeners untuk Modal ---

  // Function to start camera scanning
  function startCameraScanning() {
    scannerContainer.style.display = "block";

    // Create QR scanner if it doesn't exist
    if (!html5QrScanner) {
      html5QrScanner = new Html5Qrcode("qr-reader");

      const config = {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250,
        },
      };

      // Check if this is a mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const facingMode = isMobile ? { exact: "environment" } : "user";

      html5QrScanner.start({ facingMode: facingMode }, config, onScanSuccess, onScanError).catch((error) => {
        showError("Camera access error: " + error.message);
        scannerContainer.style.display = "none";
      });
    }
  }

  // Function to stop camera scanning
  function stopCameraScanning() {
    if (html5QrScanner && html5QrScanner.getState() === Html5QrcodeScannerState.SCANNING) {
      html5QrScanner
        .stop()
        .then(() => {
          scannerContainer.style.display = "none";
        })
        .catch((error) => {
          console.error("Error stopping camera:", error);
        });
    } else {
      scannerContainer.style.display = "none";
    }
  }

  // Successfully scanned QR code
  function onScanSuccess(decodedText, decodedResult) {
    // Stop scanning after successful scan
    stopCameraScanning();

    // Update the QRIS code field
    qrisCodeField.value = decodedText;

    // Extract merchant name and update statistics
    const merchantName = extractMerchantName(decodedText);
    updateMerchantStats(merchantName);
  }

  // Error scanning QR code
  function onScanError(errorMessage) {
    // We don't need to do anything on error as the scanner will keep trying
  }

  // Function to handle QRIS image upload
  function handleQRISImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Show loading state
    const uploadButton = document.querySelector(".upload-button");
    const originalButtonText = uploadButton.innerHTML;
    uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning...';
    uploadButton.disabled = true;

    scanQRCode(file)
      .then((result) => {
        if (result.error) {
          showError(result.error);
        } else if (result.text) {
          qrisCodeField.value = result.text;

          // Extract merchant name and update statistics for this merchant
          const merchantName = extractMerchantName(result.text);
          updateMerchantStats(merchantName);
        }
      })
      .catch((error) => {
        showError(error.message || "Unknown error scanning QR code");
      })
      .finally(() => {
        // Reset upload button
        uploadButton.innerHTML = originalButtonText;
        uploadButton.disabled = false;

        // Clear the input to allow scanning the same file again
        qrisImageInput.value = "";
      });
  }

  // Function to scan QR code from file (similar to your React implementation)
  function scanQRCode(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = function (e) {
        const img = new Image();

        img.onload = function () {
          try {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0, img.width, img.height);

            // Use the Html5Qrcode library to scan the image
            const html5QrCode = new Html5Qrcode("qr-reader-container");

            html5QrCode
              .scanFile(file, true)
              .then((decodedText) => {
                resolve({ text: decodedText });
              })
              .catch((err) => {
                resolve({ error: "Could not decode QR Code. Please try a clearer image." });
              });
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = function () {
          reject(new Error("Could not load the image"));
        };

        img.src = e.target.result;
      };

      reader.onerror = function () {
        reject(new Error("Could not read the file"));
      };

      reader.readAsDataURL(file);
    });
  }

  // Function to display error message
  function showError(message) {
    // Check if error container exists
    let errorContainer = document.getElementById("error-container");

    // Create error container if it doesn't exist
    if (!errorContainer) {
      errorContainer = document.createElement("div");
      errorContainer.id = "error-container";
      errorContainer.className = "error-message";

      // For mobile, position it better
      if (window.innerWidth < 480) {
        errorContainer.style.position = "fixed";
        errorContainer.style.bottom = "20px";
        errorContainer.style.left = "10px";
        errorContainer.style.right = "10px";
        errorContainer.style.zIndex = "1000";
      }

      const uploadContainer = document.querySelector(".upload-container") || document.querySelector(".left-panel");
      uploadContainer.parentNode.insertBefore(errorContainer, uploadContainer.nextSibling);
    }

    // Show error message
    errorContainer.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorContainer.style.display = "flex";

    // Hide error message after 5 seconds
    setTimeout(() => {
      errorContainer.style.display = "none";
    }, 5000);
  }

  // Toggle fee options visibility
  function toggleFeeOptions() {
    feeOptionsDiv.style.display = addFeeCheckbox.checked ? "block" : "none";
  }

  // Update fee label based on type
  function updateFeeLabel() {
    const feeValueLabel = feeValueField.previousElementSibling;
    if (feeTypeSelect.value === "percentage") {
      feeValueLabel.textContent = "Percentage (%)";
    } else {
      feeValueLabel.textContent = "Fixed Amount (IDR)";
    }
  }

  // Generate dynamic QRIS code
  function generateDynamicQRIS() {
    // Check if QRIS code is available
    if (!qrisCodeField.value) {
      alert("Please upload a QRIS image first");
      return;
    }

    // Get input values
    const amount = amountField.value || "0";
    const customMerchantName = merchantNameField.value;
    const originalMerchantName = extractMerchantName(qrisCodeField.value);
    const merchantName = customMerchantName || originalMerchantName;

    // Calculate fee if needed
    let totalAmount = parseFloat(amount);
    let feeStr = "";

    if (addFeeCheckbox.checked) {
      const feeValue = parseFloat(feeValueField.value);
      if (feeTypeSelect.value === "percentage") {
        // For percentage fee
        const feeAmount = totalAmount * (feeValue / 100);
        totalAmount += feeAmount;
        feeStr = "55020357" + String(feeValue).length.toString().padStart(2, "0") + feeValue;
      } else {
        // For fixed fee
        totalAmount += feeValue;
        feeStr = "55020256" + String(feeValue).length.toString().padStart(2, "0") + feeValue;
      }
    }

    // Generate modified QRIS string using the PHP logic
    const newQrisString = generateModifiedQrisString(qrisCodeField.value, amount, feeStr, customMerchantName);

    // Display the result
    generatedQrisCode.value = newQrisString;
    resultCard.style.display = "block";
    generatedQrisCode.style.display = "none"; // Sembunyikan text area QRIS String

    // --- AWAL BLOK OPSIONAL: Sembunyikan Label ---
    // Jika ada label terpisah untuk text area, Anda bisa menyembunyikannya juga.
    // Cari label, misalnya jika labelnya adalah elemen tepat sebelum textarea:
    // const qrisStringLabel = generatedQrisCode.previousElementSibling;
    // if (qrisStringLabel && qrisStringLabel.tagName === 'LABEL') {
    //      qrisStringLabel.style.display = 'none';
    // }
    // Atau jika label memiliki ID atau kelas spesifik:
    // const labelElement = document.querySelector('label[for="generatedQrisCode"]'); // Ganti dengan selector yang benar
    // if (labelElement) {
    //     labelElement.style.display = 'none';
    // }
    // --- AKHIR BLOK OPSIONAL ---

    // --- AWAL BLOK BARU: Sembunyikan Label ---
    // Coba temukan label yang berasosiasi dengan textarea atau label di dekatnya.
    // Ganti selector ini jika label Anda memiliki struktur HTML yang berbeda.
    // Opsi 1: Jika label menggunakan atribut 'for'
    const qrisStringLabel = document.querySelector('label[for="generatedQrisCode"]');
    if (qrisStringLabel) {
      qrisStringLabel.style.display = "none";
    } else {
      // Opsi 2: Jika label adalah elemen sebelumnya (sibling)
      const previousElement = generatedQrisCode.previousElementSibling;
      // Anda mungkin perlu menyesuaikan pengecekan ini jika ada elemen lain di antaranya
      if (previousElement && (previousElement.tagName === "LABEL" || previousElement.textContent.includes("QRIS String"))) {
        previousElement.style.display = "none";
      }
      // Opsi 3: Jika label memiliki ID atau kelas spesifik (misal, id="qris-string-label")
      // const specificLabel = document.getElementById('qris-string-label');
      // if (specificLabel) {
      //     specificLabel.style.display = 'none';
      // }
    }
    // --- AKHIR BLOK BARU ---

    // Generate QR Code image
    qrImageContainer.innerHTML = "";
    QRCode.toCanvas(newQrisString, { errorCorrectionLevel: "H" }, function (error, canvas) {
      if (error) {
        console.error("Error generating QR code:", error);
        return;
      }
      qrImageContainer.appendChild(canvas);
    });

    // Track this transaction for the merchant - use original merchant name for tracking
    addTransaction(originalMerchantName, totalAmount, merchantName);
  }

  // Generate modified QRIS string based on the PHP reference with merchant name customization
  function generateModifiedQrisString(originalQris, amount, feeStr = "", customMerchantName = "") {
    try {
      // Remove last 4 characters (CRC16)
      let qris = originalQris.substring(0, originalQris.length - 4);

      // Replace 010211 with 010212 to indicate dynamic QR
      let step1 = qris.replace("010211", "010212");

      // Split by 5802ID to handle the amount correctly
      let parts = step1.split("5802ID");

      // Format amount
      let amountStr = "54" + String(amount).length.toString().padStart(2, "0") + amount;

      // If custom merchant name is provided, replace the merchant name tag (59)
      if (customMerchantName && customMerchantName.trim() !== "") {
        // Parse the QRIS string to identify all tags
        const tags = parseQRISTags(qris);

        // Find the merchant name tag (59)
        if (tags["59"]) {
          // Create a new merchant name field
          const merchantTag = "59" + String(customMerchantName.length).toString().padStart(2, "0") + customMerchantName;

          // Replace the old merchant name tag with the new one
          qris = qris.replace(tags["59"].fullTag, merchantTag);

          // Re-split the string after modification
          parts = qris.replace("010211", "010212").split("5802ID");
        }
      }

      // Combine parts
      if (feeStr === "") {
        amountStr += "5802ID";
      } else {
        amountStr += feeStr + "5802ID";
      }

      // Build final string
      let fixStr = parts[0] + amountStr + parts[1];

      // Add CRC16 checksum
      fixStr += convertCRC16(fixStr);

      return fixStr;
    } catch (error) {
      console.error("Error modifying QRIS string:", error);
      return originalQris;
    }
  }

  // Parse QRIS tags into a structured object
  function parseQRISTags(qrisString) {
    const tags = {};
    let position = 0;

    while (position < qrisString.length) {
      // Get tag ID (2 characters)
      const tagId = qrisString.substr(position, 2);
      position += 2;

      // Get tag length (2 characters)
      const lengthStr = qrisString.substr(position, 2);
      const length = parseInt(lengthStr, 10);
      position += 2;

      // Get tag value
      const value = qrisString.substr(position, length);
      position += length;

      // Store in tags object
      tags[tagId] = {
        id: tagId,
        length: length,
        value: value,
        fullTag: tagId + lengthStr + value,
      };
    }

    return tags;
  }

  // Extract merchant name from QRIS string
  function extractMerchantName(qrisString) {
    try {
      const tags = parseQRISTags(qrisString);
      if (tags["59"]) {
        return tags["59"].value;
      }
    } catch (error) {
      console.error("Error extracting merchant name:", error);
    }
    return "Unknown Merchant";
  }

  // CRC16 calculation function ported from PHP
  function convertCRC16(str) {
    let crc = 0xffff;
    let strlen = str.length;

    for (let c = 0; c < strlen; c++) {
      crc ^= str.charCodeAt(c) << 8;
      for (let i = 0; i < 8; i++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }

    let hex = crc & 0xffff;
    hex = hex.toString(16).toUpperCase();

    if (hex.length == 3) hex = "0" + hex;

    return hex;
  }

  // Download QR Code
  function downloadQRCode() {
    const canvas = qrImageContainer.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "qris-code.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  // Copy QRIS string
  function copyQRISString() {
    generatedQrisCode.select();
    document.execCommand("copy");

    // Show feedback
    const originalText = copyBtn.textContent;
    copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    setTimeout(() => {
      copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy String';
    }, 2000);
  }

  // Add transaction to history
  function addTransaction(originalMerchantName, amount, displayName = null) {
    // Get stored transaction data
    let storedData = JSON.parse(localStorage.getItem("transactionData")) || {};

    if (!storedData[originalMerchantName]) {
      storedData[originalMerchantName] = {
        transactions: 0,
        totalValue: 0,
      };
    }

    storedData[originalMerchantName].transactions++;
    storedData[originalMerchantName].totalValue += parseFloat(amount);

    // Save to localStorage
    localStorage.setItem("transactionData", JSON.stringify(storedData));
    // Update in-memory variable
    transactionData = storedData;

    // Update stats display for the current merchant (if it's the one being displayed)
    if (currentMerchantOriginalName === originalMerchantName) {
      displayMerchantStats(storedData[originalMerchantName]);
      // Update title in case it was marked as "New"
      updateMerchantStatsTitle(displayName || originalMerchantName, originalMerchantName, false);
    }
  }

  // Update statistics based on merchant name from uploaded QR
  function updateMerchantStats(merchantName, originalMerchantName = null) {
    if (!merchantName || merchantName === "Unknown Merchant") return;

    // Show the stats container
    statsContainer.style.display = "block"; // Ensure container is visible

    // If original merchant name wasn't provided, assume it's the same as merchant name
    originalMerchantName = originalMerchantName || merchantName;
    currentMerchantOriginalName = originalMerchantName; // Store the current merchant

    // Get stored transaction data
    const storedData = JSON.parse(localStorage.getItem("transactionData")) || {};
    const merchantStats = storedData[originalMerchantName];

    // Check if we have data for this merchant
    if (merchantStats) {
      // Display merchant-specific stats
      displayMerchantStats(merchantStats);
      updateMerchantStatsTitle(merchantName, originalMerchantName, false);
    } else {
      // This is a new merchant, display zero stats
      displayMerchantStats({ transactions: 0, totalValue: 0 });
      updateMerchantStatsTitle(merchantName, originalMerchantName, true);
    }
  }

  // Update the title of the stats section to show which merchant we're viewing
  function updateMerchantStatsTitle(merchantName, originalMerchantName, isNew = false) {
    // Update the merchant-title-container
    const merchantTitleEl = document.querySelector(".merchant-title-container");

    if (merchantTitleEl) {
      // If custom name is different from original, show both
      if (merchantName !== originalMerchantName) {
        merchantTitleEl.innerHTML = `${merchantName} ${isNew ? '<span class="new-merchant">(Merchant Baru)</span>' : ""}`;
      } else {
        // Otherwise just show the merchant name
        merchantTitleEl.innerHTML = `${merchantName} ${isNew ? '<span class="new-merchant">(Merchant Baru)</span>' : ""}`;
      }
    }
  }

  // Renamed function: Display stats for a specific merchant
  function displayMerchantStats(stats) {
    const totalTransactions = stats.transactions || 0;
    const totalValue = stats.totalValue || 0;
    const averageValue = totalTransactions > 0 ? totalValue / totalTransactions : 0;

    // Update the UI elements
    totalTransactionsEl.textContent = totalTransactions;
    totalValueEl.textContent = `Rp ${formatNumber(totalValue)}`;
    averageValueEl.textContent = `Rp ${formatNumber(averageValue)}`;
  }

  // Function to reset transaction statistics FOR THE CURRENT MERCHANT
  function resetTransactionStats() {
    if (!currentMerchantOriginalName) {
      alert("No merchant data is currently displayed to reset."); // Changed text
      return;
    }

    if (confirm(`Are you sure you want to reset the transaction info for ${currentMerchantOriginalName}? This action cannot be undone.`)) {
      // Changed text
      // Get current data
      let storedData = JSON.parse(localStorage.getItem("transactionData")) || {};

      // Remove data for the current merchant
      if (storedData[currentMerchantOriginalName]) {
        delete storedData[currentMerchantOriginalName];
        // Update localStorage
        localStorage.setItem("transactionData", JSON.stringify(storedData));
        // Update in-memory variable
        transactionData = storedData;
      }

      // Update the display to show zeros for this merchant
      displayMerchantStats({ transactions: 0, totalValue: 0 });

      // Hide the stats container and clear the title
      statsContainer.style.display = "none";
      merchantTitleEl.textContent = "";
      currentMerchantOriginalName = null; // Reset current merchant tracker
    }
  }

  // --- AWAL: Fungsi Baru untuk Menampilkan Modal ---
  function promptResetConfirmation() {
    if (!currentMerchantOriginalName) {
      alert("Tidak ada data merchant yang ditampilkan saat ini untuk direset.");
      return;
    }

    // Set pesan di modal - pastikan pesan ini sesuai keinginan
    // Contoh: "Do you really want to reset transaction info for [Nama Merchant]? This process cannot be undone."
    resetConfirmationMessage.textContent = `Apakah Anda yakin ingin mereset info transaksi untuk ${currentMerchantOriginalName}? Tindakan ini tidak dapat dibatalkan.`; // Anda bisa sesuaikan teks ini jika mau

    // Tampilkan modal
    resetModal.style.display = "flex";
    setTimeout(() => resetModal.classList.add("active"), 10);
  }
  // --- AKHIR: Fungsi Baru untuk Menampilkan Modal ---

  // Ubah nama fungsi reset yang lama atau buat fungsi baru untuk logika intinya
  function executeReset() {
    // Fungsi ini berisi logika reset yang sebelumnya ada di resetTransactionStats
    if (!currentMerchantOriginalName) return;

    let storedData = JSON.parse(localStorage.getItem("transactionData")) || {};

    if (storedData[currentMerchantOriginalName]) {
      delete storedData[currentMerchantOriginalName];
      localStorage.setItem("transactionData", JSON.stringify(storedData));
      transactionData = storedData;
    }

    displayMerchantStats({ transactions: 0, totalValue: 0 });

    if (statsContainer) statsContainer.style.display = "none"; // Sembunyikan container utama
    if (merchantTitleEl) merchantTitleEl.textContent = ""; // Kosongkan judul

    currentMerchantOriginalName = null;
  }

  // --- AWAL: Fungsi untuk Menutup Modal ---
  function closeResetModal() {
    if (resetModal) {
      // Pastikan modal ada
      resetModal.classList.remove("active");
      setTimeout(() => {
        resetModal.style.display = "none";
      }, 300);
    }
  }
  // --- AKHIR: Fungsi untuk Menutup Modal ---

  // Format number with thousands separator
  function formatNumber(number) {
    return number.toLocaleString("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
});
