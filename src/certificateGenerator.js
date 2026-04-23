import { jsPDF } from "jspdf";

export const getCertificateDataUrl = async (name, day, role = 'Student') => {
  return new Promise((resolve) => {
    const doc = generateBaseDoc(name, day, role);
    // Tiny delay to ensure the PDF buffer is ready for the preview
    setTimeout(() => {
      resolve(doc.output("datauristring"));
    }, 50);
  });
};

export const downloadCertificate = async (name, day, role = 'Student') => {
  const doc = generateBaseDoc(name, day, role);
  doc.save(`Data_Insights_2026_Cert_${name.replace(/\s+/g, '_')}.pdf`);
};

const generateBaseDoc = (name, day, role) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [1123, 794], // A4 Landscape
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // 1. THE BACKGROUND
  // This uses your dark theme background from the public folder
  doc.addImage("/cert-bg.png", "PNG", 0, 0, width, height);

  // 2. THE LOGOS (NEMSU Left, CITE Right)
  doc.addImage("/logo-nemsu.png", "PNG", 60, 45, 65, 65); 
  doc.addImage("/logo-cite.png", "PNG", width - 125, 45, 65, 65);

  // 3. HEADER TEXT (White color to show on dark background)
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("Republic of the Philippines", width / 2, 50, { align: "center" });
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("NORTH EASTERN MINDANAO STATE UNIVERSITY", width / 2, 70, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("Lianga Campus", width / 2, 85, { align: "center" });

  doc.setFontSize(16);
  doc.text("College of Information Technology Education", width / 2, 110, { align: "center" });
  doc.setFontSize(12);
  doc.text("Department of Computer Studies", width / 2, 125, { align: "center" });

  // 4. CERTIFICATE TITLE (Gold color)
  doc.setTextColor(201, 168, 76); // Your custom gold color
  doc.setFontSize(50);
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFICATE OF PARTICIPATION", width / 2, 190, { align: "center" });
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text("This certificate is hereby presented to", width / 2, 220, { align: "center" });

  // 5. THE NAME (Large, Bold, White)
  doc.setFontSize(65);
  doc.setFont("helvetica", "bold");
  doc.text(name.toUpperCase(), width / 2, 300, { align: "center" });

  // 6. EVENT DESCRIPTION
  doc.setFontSize(14);
  const eventName = "DATA INSIGHTS 2026: NAVIGATING THE DATA MINING FRONTIER";
  
  const desc = [
    "for actively participating in the virtual training series entitled:",
    eventName,
    `held virtually via Google Meet on ${getDayLabel(day)}, in recognition of commitment`,
    "to learning and professional development through active engagement in the training sessions."
  ];

  doc.text(desc[0], width / 2, 340, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text(desc[1], width / 2, 360, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(desc[2], width / 2, 380, { align: "center" });
  doc.text(desc[3], width / 2, 395, { align: "center" });

  // 7. FOOTER & LOCATION
  doc.setFontSize(12);
  doc.text(`Given this ${getDayLabel(day)} at NEMSU – Lianga Campus, Surigao del Sur.`, width / 2, 440, { align: "center" });

  // 8. SIGNATURE (Removed blue line as requested)
  // Placing the signature image slightly above the name
  doc.addImage("/logo-signature.png", "PNG", width / 2 - 50, 470, 100, 50);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("CHRISTINE W. PITOS, MSCS", width / 2, 530, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("BSCS Program Coordinator", width / 2, 545, { align: "center" });

  return doc;
};

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
