import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { toPng } from 'html-to-image';

/**
 * Renders a single CV page DOM element into an image data URL (PNG/JPEG)
 * Uses html2canvas-pro with full support for modern CSS color spaces (oklab, oklch),
 * with an automatic fallback to html-to-image (browser SVG foreignObject).
 */
async function renderPageToImage(pageEl: HTMLElement, containerId: string): Promise<string> {
  try {
    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
      onclone: (clonedDoc) => {
        // Reset scale transform on container in the clone to capture at exact A4 1:1 pixel fidelity
        const clonedContainer = clonedDoc.getElementById(containerId);
        if (clonedContainer) {
          clonedContainer.style.transform = 'none';
        }
      },
    });

    return canvas.toDataURL('image/jpeg', 0.95);
  } catch (primaryErr) {
    console.warn('html2canvas-pro capture encounter, trying native browser renderer:', primaryErr);
    // Fallback: html-to-image renders using native browser engine, completely bypassing manual CSS color parsing
    return await toPng(pageEl, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });
  }
}

export async function exportCVToPDF(
  containerId: string = 'cv-print-area',
  filename: string = 'Fazle_Rabbi_CV.pdf'
): Promise<void> {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error('CV preview container not found.');
  }

  // Find all .cv-page elements inside the container
  const pageElements = container.querySelectorAll<HTMLElement>('.cv-page');
  if (pageElements.length === 0) {
    throw new Error('No CV page elements found.');
  }

  // A4 dimensions in mm: 210 x 297
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  for (let i = 0; i < pageElements.length; i++) {
    const pageEl = pageElements[i];

    // Render page element to high-res image
    const imgData = await renderPageToImage(pageEl, containerId);

    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    const format = imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    pdf.addImage(imgData, format, 0, 0, 210, 297);
  }

  pdf.save(filename);
}

export async function generateCVPdfBase64(
  containerId: string = 'cv-print-area'
): Promise<string> {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error('CV preview container not found.');
  }

  const pageElements = container.querySelectorAll<HTMLElement>('.cv-page');
  if (pageElements.length === 0) {
    throw new Error('No CV page elements found.');
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  for (let i = 0; i < pageElements.length; i++) {
    const pageEl = pageElements[i];
    const imgData = await renderPageToImage(pageEl, containerId);

    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    const format = imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    pdf.addImage(imgData, format, 0, 0, 210, 297);
  }

  const dataUri = pdf.output('datauristring');
  return dataUri.split(',')[1];
}

