import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateReport = async (elementId: string, patientName: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error(`Element with id ${elementId} not found`);
        return;
    }

    try {
        // Show loading state or feedback if needed (handled by caller usually)

        // Capture the element
        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
            useCORS: true, // Enable CORS for images
            logging: false,
            backgroundColor: '#ffffff' // Ensure white background
        });

        const imgData = canvas.toDataURL('image/png');

        // PDF setup
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add subsequent pages if content overflows
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Save the PDF
        const date = new Date().toISOString().split('T')[0];
        pdf.save(`Reporte_Cognitivo_${patientName.replace(/\s+/g, '_')}_${date}.pdf`);

    } catch (error) {
        console.error('Error generating PDF report:', error);
        throw error;
    }
};
