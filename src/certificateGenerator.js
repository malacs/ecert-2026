import { jsPDF } from "jspdf";

/**
 * Generates a high-quality Data URL (base64) of the certificate 
 * for previewing on the website.
 */
export const getCertificateDataUrl = async (name, day, role = 'Student') => {
  return new Promise((resolve) => {
    const doc = generateBaseDoc(name, day, role);
    resolve(doc.output("datauristring"));
  });
};

/**
 * Triggers a direct PDF download for the user.
 */
export const downloadCertificate = async (name, day, role = 'Student') => {
  const doc = generateBaseDoc(name, day, role);
  doc.save(`Data_Insights_2026_Certificate_${name.replace(/\s+/g, '_')}.pdf`);
};

/**
 * Core Logic: Shared by both Preview and Download.
 * Adjusts layout based on role and specific event dates.
 */
const generateBaseDoc = (name, day, role) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [1123, 794], // A4 Landscape at 96 DPI
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // 1. Background Fill
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, height, "F");

  // 2. Decorative Border
  doc.setDrawColor(201, 168, 76); // Gold color
  doc.setLineWidth(15);
  doc.rect(20, 20, width - 40, height - 40);
  doc.setLineWidth(2);
  doc.rect(30, 30, width - 60, height - 60);

  // 3. Header Text
  doc.setTextColor(15, 23, 42); // Dark Navy
  doc.setFont("helvetica", "bold");
  doc.setFontSize(42);
  doc.text("NORTH EASTERN MINDANAO STATE UNIVERSITY", width / 2, 80, { align: "center" });

  doc.setFontSize(18);
  doc.setFont("helvetica", "normal");
  doc.text("Lianga Campus | College of Information Technology Education", width / 2, 105, { align: "center" });

  // 4. Main Title
  doc.setFontSize(60);
  doc.setTextColor(201, 168, 76);
  doc.setFont("times", "bolditalic");
  doc.text("Certificate of Participation", width / 2, 180, { align: "center" });

  // 5. Body Text
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(22);
  doc.text("This is to certify that", width / 2, 240, { align: "center" });

  // 6. Participant Name
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(55);
  doc.text(name.toUpperCase(), width / 2, 310, { align: "center" });

  // 7. Context Description
  doc.setTextColor(60, 60, 60);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(20);
  const eventText = role === 'Speaker' 
    ? "for sharing their invaluable expertise as a Resource Speaker during the"
    : "for actively participating in the virtual training series entitled:";
  doc.text(eventText, width / 2, 360, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(28);
  doc.text("DATA INSIGHTS 2026: NAVIGATING THE DATA MINING FRONTIER", width / 2, 400, { align: "center" });

  // 8. Date and Venue
  doc.setFont("helvetica", "normal");
  doc.setFontSize(18);
  const dateLabel = getDayLabel(day);
  doc.text(`Held on ${dateLabel} via Virtual Conferencing`, width / 2, 440, { align: "center" });

  // 9. Signatures Area
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(1);

  // Instructor Signature
  doc.line(width / 2 - 150, 580, width / 2 + 150, 580);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CHRISTINE W. PITOS, MSCS", width / 2, 600, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("BSCS Program Coordinator", width / 2, 620, { align: "center" });

  return doc;
};

// Helper to convert Day 1, 2, etc. to actual dates
const getDayLabel = (day) => {
  const dates = {
    "1": "April 15, 2026",
    "2": "April 17, 2026",
    "3": "April 22, 2026",
    "4": "April 24, 2026",
    "5": "April 29, 2026"
  };
  return dates[day] || "April 2026";
};
