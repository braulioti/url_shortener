import QRCode from "qrcode";

const QR_OPTIONS = {
  width: 256,
  margin: 2,
  errorCorrectionLevel: "M" as const,
};

export async function generateQrCodePng(shortUrl: string): Promise<Buffer> {
  return QRCode.toBuffer(shortUrl, {
    ...QR_OPTIONS,
    type: "png",
  });
}
