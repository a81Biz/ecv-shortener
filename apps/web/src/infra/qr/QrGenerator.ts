// Generación de QR en el cliente (PNG data URL) usando 'qrcode'
import QRCode from 'qrcode';

export async function qrPngDataUrl(text: string, scale = 6): Promise<string> {
  // errorCorrectionLevel 'L' suficiente para URLs cortas
  return QRCode.toDataURL(text, { errorCorrectionLevel: 'L', scale });
}
