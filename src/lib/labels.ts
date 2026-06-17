import { PDFDocument, StandardFonts, rgb, type PDFImage } from 'pdf-lib';
import { qrPng, vehicleUrl } from './qr';
import type { Settings, Vehicle } from './types';

const MM = 2.834645669; // points per millimetre

// Brother DK-11209 standard address label: 62 mm x 29 mm (H x B in the product
// description is 62 x 29; the printable area is landscape 62 wide x 29 tall).
const LABEL_W = 62 * MM;
const LABEL_H = 29 * MM;

function hexToRgb(hex: string) {
  const c = (hex || '#000000').replace('#', '');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
}

/** Shrink a string until it fits maxWidth at the given font size. */
function fitText(text: string, font: import('pdf-lib').PDFFont, size: number, maxWidth: number): number {
  let s = size;
  while (s > 5 && font.widthOfTextAtSize(text, s) > maxWidth) s -= 0.5;
  return s;
}

export interface LabelInput {
  vehicle: Vehicle;
  url: string;
}

/**
 * Build a multi-page PDF — one DK-11209 label per vehicle.
 */
export async function buildLabelPdf(
  vehicles: Vehicle[],
  settings: Settings,
  baseUrl: string,
  logoBytes?: Uint8Array | null,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  let logo: PDFImage | null = null;
  if (logoBytes && logoBytes.length > 0) {
    try {
      logo = await pdf.embedPng(logoBytes);
    } catch {
      try {
        logo = await pdf.embedJpg(logoBytes);
      } catch {
        logo = null;
      }
    }
  }

  const brand = hexToRgb(settings.primary_color);

  for (const v of vehicles) {
    const page = pdf.addPage([LABEL_W, LABEL_H]);
    const margin = 2.5 * MM;

    // QR code on the left, square, full height minus margins.
    const qrSize = LABEL_H - margin * 2;
    const url = vehicleUrl(baseUrl, v.public_id);
    const png = await qrPng(url, { scale: 8, margin: 0 });
    const qrImg = await pdf.embedPng(png);
    page.drawImage(qrImg, { x: margin, y: margin, width: qrSize, height: qrSize });

    // Text area to the right of the QR code.
    const textX = margin + qrSize + 2.5 * MM;
    const textW = LABEL_W - textX - margin;
    let cursorY = LABEL_H - margin - 8;

    const headline = (v.label_headline || settings.label_headline || '').trim();
    if (headline) {
      const size = fitText(headline, fontBold, 9, textW);
      page.drawText(headline, { x: textX, y: cursorY, size, font: fontBold, color: brand });
      cursorY -= size + 3;
    }

    // License plate — the main, clearly legible identifier for the driver.
    const plate = (v.license_plate || v.name || '').trim();
    if (plate) {
      const size = fitText(plate, fontBold, 16, textW);
      cursorY -= size;
      page.drawText(plate, { x: textX, y: cursorY, size, font: fontBold, color: rgb(0, 0, 0) });
      cursorY -= 4;
    }

    // Optional friendly name / model under the plate.
    const name = (v.name && v.name !== plate ? v.name : '').trim();
    if (name) {
      const size = fitText(name, font, 8, textW);
      cursorY -= size;
      page.drawText(name, { x: textX, y: cursorY, size, font, color: rgb(0.25, 0.25, 0.25) });
    }

    // Call to action at the bottom.
    const subtext = (settings.label_subtext || 'Hier scannen').trim();
    if (subtext) {
      const size = fitText(subtext, fontBold, 9, textW - (logo ? 12 * MM : 0));
      page.drawText(subtext, { x: textX, y: margin + 1, size, font: fontBold, color: brand });
    }

    // Optional small logo in the bottom-right corner.
    if (logo) {
      const lh = 7 * MM;
      const lw = (logo.width / logo.height) * lh;
      const maxLw = 16 * MM;
      const fw = Math.min(lw, maxLw);
      const fh = (logo.height / logo.width) * fw;
      page.drawImage(logo, {
        x: LABEL_W - margin - fw,
        y: margin,
        width: fw,
        height: fh,
      });
    }
  }

  return pdf.save();
}
