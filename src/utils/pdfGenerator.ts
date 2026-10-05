import jsPDF from 'jspdf';
import { toJpeg, toPng } from 'html-to-image';

/**
 * Safely resolves the jsPDF constructor across different bundler environments (ESM / CJS).
 */
function getJsPdfConstructor(): typeof jsPDF {
  if (typeof jsPDF === 'function') {
    return jsPDF;
  }
  if ((jsPDF as any)?.jsPDF && typeof (jsPDF as any).jsPDF === 'function') {
    return (jsPDF as any).jsPDF;
  }
  if ((jsPDF as any)?.default && typeof (jsPDF as any).default === 'function') {
    return (jsPDF as any).default;
  }
  return jsPDF;
}

/**
 * Locates the target paper document element in the DOM.
 */
function findTargetElement(elementId: string): HTMLElement {
  const direct = document.getElementById(elementId);
  if (direct) {
    const innerSheet = direct.querySelector('.official-sheet-document') as HTMLElement | null;
    if (innerSheet) return innerSheet;
    return direct;
  }

  const sheet = document.querySelector('.official-sheet-document') as HTMLElement | null;
  if (sheet) return sheet;

  const fallbacks = [
    document.querySelector('[id^="paper-doc-"]') as HTMLElement | null,
    document.getElementById('success-paper-document'),
    document.getElementById('official-paper-document'),
    document.querySelector('.printable-document') as HTMLElement | null,
    document.querySelector('.font-serif') as HTMLElement | null,
  ];

  for (const el of fallbacks) {
    if (el) return el;
  }

  throw new Error(`Document #${elementId} introuvable pour la génération du PDF.`);
}

/**
 * Generates an official high-resolution A4 PDF document from a DOM element
 * using html-to-image (which natively supports modern CSS / oklch colors and SVGs).
 * Automatically triggers file download and returns the Blob URL.
 */
export async function generatePdfFromElement(
  elementId: string,
  filename: string = 'formulaire_droit_image.pdf'
): Promise<string> {
  const sourceElement = findTargetElement(elementId);

  // Use html-to-image with high pixel density for crisp vector-like text
  let imgData: string;
  try {
    imgData = await toJpeg(sourceElement, {
      quality: 0.98,
      backgroundColor: '#ffffff',
      pixelRatio: 2,
      cacheBust: true,
    });
  } catch (jpegErr) {
    console.warn('toJpeg error, falling back to toPng:', jpegErr);
    imgData = await toPng(sourceElement, {
      backgroundColor: '#ffffff',
      pixelRatio: 2,
      cacheBust: true,
    });
  }

  const JsPdfClass = getJsPdfConstructor();

  // Standard A4 dimensions in mm (210 x 297)
  const a4Width = 210;
  const a4Height = 297;

  const pdf = new JsPdfClass({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Impossible de charger l'image générée."));
    img.src = imgData;
  });

  // Calculate proportional dimensions so the entire document fits on EXACTLY 1 page
  const ratio = img.naturalWidth / img.naturalHeight;
  let renderWidth = a4Width;
  let renderHeight = a4Width / ratio;

  // If the rendered height exceeds the A4 page height (297mm), scale down to fit 1 page
  if (renderHeight > a4Height) {
    renderHeight = a4Height;
    renderWidth = a4Height * ratio;
  }

  // Center horizontally and vertically on the single A4 sheet
  const xOffset = Math.max(0, (a4Width - renderWidth) / 2);
  const yOffset = Math.max(0, (a4Height - renderHeight) / 2);

  pdf.addImage(imgData, 'JPEG', xOffset, yOffset, renderWidth, renderHeight);

  const blob = pdf.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  // Trigger file download
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 1200);

  return blobUrl;
}

/**
 * Handles printing the official document cleanly:
 * 1. Attempts direct native window.print().
 * 2. Simultaneously generates the official high-resolution A4 PDF via html-to-image
 *    and triggers download / opens the printable document.
 */
export async function printDocumentOrElement(
  elementId: string = 'official-paper-document',
  filename: string = 'formulaire_droit_image_A_IMPRIMER.pdf'
): Promise<{ method: 'print' | 'pdf'; blobUrl?: string; message?: string }> {
  let printSucceeded = false;

  try {
    window.print();
    printSucceeded = true;
  } catch (err) {
    console.warn('Native window.print() was blocked by browser sandbox/iframe:', err);
  }

  // Always generate and download the high-resolution A4 PDF
  try {
    const blobUrl = await generatePdfFromElement(elementId, filename);

    return {
      method: printSucceeded ? 'print' : 'pdf',
      blobUrl,
      message: printSucceeded
        ? "Boîte d'impression ouverte. Le document officiel A4 a également été téléchargé."
        : "Document officiel A4 généré et téléchargé avec succès pour impression.",
    };
  } catch (pdfErr: any) {
    if (printSucceeded) {
      return { method: 'print', message: "Boîte d'impression lancée." };
    }
    console.error('Erreur génération PDF pour impression:', pdfErr);
    throw pdfErr;
  }
}

export function printDocument(): void {
  printDocumentOrElement('official-paper-document');
}
