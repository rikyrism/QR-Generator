import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { QRISData } from '../types'; // Use original QRISData

// No need for QRISFormData anymore, use QRISData directly

interface QRFormProps {
  qrisString: string;
  onSubmit: (data: QRISData) => void; // Use original QRISData type
  loading: boolean;
}

const QRForm: React.FC<QRFormProps> = ({ qrisString, onSubmit, loading }) => {
  const [quantity, setQuantity] = useState<string>('');
  // Remove customMerchantName state
  const [serviceFee, setServiceFee] = useState<boolean>(false);
  const [feeType, setFeeType] = useState<'r' | 'p'>('r');
  const [feeValue, setFeeValue] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      qris: qrisString,
      qty: quantity,
      // Remove customMerchantName from submitted data
      service_fee: serviceFee,
      fee_type: feeType,
      fee_value: feeValue
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="qty" className="label">
          Amount (IDR)
        </label>
        <input
          id="qty"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="input"
          placeholder="Enter amount"
          required
        />
      </div>

      {/* Removed Custom Merchant Name Input Section */}

      <div className="flex items-center gap-2">
        <input
          id="serviceFee"
          type="checkbox"
          checked={serviceFee}
          onChange={(e) => setServiceFee(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <label htmlFor="serviceFee" className="text-sm text-gray-700">
          Add Service Fee
        </label>
      </div>

      {serviceFee && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Fee Type</label>
            <select
              value={feeType}
              onChange={(e) => setFeeType(e.target.value as 'r' | 'p')}
              className="input"
            >
              <option value="r">Fixed Amount</option>
              <option value="p">Percentage</option>
            </select>
          </div>
          <div>
            <label className="label">
              {feeType === 'p' ? 'Percentage (%)' : 'Amount (IDR)'}
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*\.?[0-9]*"
              value={feeValue}
              onChange={(e) => setFeeValue(e.target.value)}
              className="input"
              placeholder={feeType === 'p' ? 'Enter percentage' : 'Enter amount'}
              required={serviceFee}
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="animate-spin" size={18} />}
        {loading ? 'Generating...' : 'Generate QR Code'}
      </button>
    </form>
  );
};

export default QRForm;