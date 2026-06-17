import QRCode from 'qrcode';

export function vehicleUrl(baseUrl: string, publicId: string): string {
  const base = baseUrl ? baseUrl.replace(/\/+$/, '') : '';
  return `${base}/v/${publicId}`;
}

export async function qrPng(data: string, opts?: { scale?: number; margin?: number; dark?: string; light?: string }): Promise<Buffer> {
  return QRCode.toBuffer(data, {
    type: 'png',
    errorCorrectionLevel: 'M',
    scale: opts?.scale ?? 10,
    margin: opts?.margin ?? 1,
    color: {
      dark: opts?.dark ?? '#000000',
      light: opts?.light ?? '#ffffff',
    },
  });
}

export async function qrSvg(data: string, opts?: { margin?: number; dark?: string; light?: string }): Promise<string> {
  return QRCode.toString(data, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: opts?.margin ?? 1,
    color: {
      dark: opts?.dark ?? '#000000',
      light: opts?.light ?? '#ffffff',
    },
  });
}
