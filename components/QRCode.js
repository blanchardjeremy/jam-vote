import React from 'react';

const QRCode = ({ url, size = 200, color }) => {
  // const [r, g, b] = hslToRgb(226, 70, 55.5);
  const [r, g, b] = [55, 48, 163]; // Indigio 800 - brand color
  const colorParam = color || `${r}-${g}-${b}`;
  
  // URL encode the input URL
  const encodedUrl = encodeURIComponent(url);
  
  // Construct the QR code API URL with color parameter
  const qrCodeUrl = `http://api.qrserver.com/v1/create-qr-code/?data=${encodedUrl}&size=${size}x${size}&color=${colorParam}`;
  
  return (
    <div className="inline-block">
      <img 
        src={qrCodeUrl}
        alt={`QR Code for ${url}`}
        className="rounded-lg shadow-sm"
        width={size}
        height={size}
      />
    </div>
  );
};

export default QRCode;