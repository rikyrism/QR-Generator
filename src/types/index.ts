export interface QRISData {
  qris: string;
  qty: string;
  service_fee: boolean;
  fee_type: 'r' | 'p'; // r = fixed rate, p = percentage
  fee_value: string;
}

export interface QRISResult {
  status: 'success' | 'error';
  qrisString?: string;
  qrisBase64?: string;
  message?: string;
  error?: string;
}

export interface ScanResult {
  data: string;
  format?: string;
  error?: string;
}
