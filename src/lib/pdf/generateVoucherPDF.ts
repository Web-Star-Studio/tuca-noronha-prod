import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Generate a PDF from an HTML element (voucher)
 * @param element - The HTML element to convert to PDF
 * @returns Promise<Blob> - The PDF file as a blob
 */
export async function generateVoucherPDF(element: HTMLElement): Promise<Blob> {
  try {
    // Configure html2canvas options for better quality
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      useCORS: true, // Allow cross-origin images
      logging: false, // Disable logging
      backgroundColor: "#ffffff", // White background
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Create PDF
    const pdf = new jsPDF({
      orientation: imgHeight > imgWidth ? "portrait" : "landscape",
      unit: "mm",
      format: "a4",
    });

    // Add image to PDF
    const imgData = canvas.toDataURL("image/png", 1.0);
    let position = 0;

    // Add first page
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if content is longer than one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Convert to blob
    const pdfBlob = pdf.output("blob");
    return pdfBlob;
  } catch {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF");
  }
}

/**
 * Generate a PDF and trigger download
 * @param element - The HTML element to convert to PDF
 * @param filename - The name of the file to download
 */
export async function downloadVoucherPDF(
  element: HTMLElement,
  filename: string = "voucher.pdf"
): Promise<void> {
  try {
    const pdfBlob = await generateVoucherPDF(element);
    
    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch {
    console.error("Error downloading PDF:", error);
    throw error;
  }
} 