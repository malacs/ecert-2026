import { jsPDF } from "jspdf";

export const getCertificateDataUrl = async (name, day, role) => {
  const doc = await generateBaseDoc(name, day, role);
  return doc.output("datauristring");
};

export const downloadCertificate = async (name, day, role) => {
  const doc = await generateBaseDoc(name, day, role);
  doc.save(`Certificate_${name.replace(/\s+/g, '_')}.pdf`);
};

const generateBaseDoc = async (name, day, role) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "px", format: [1123, 794] });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // 1. Background
  doc.addImage("/cert-bg.png", "PNG", 0, 0, width, height);

  // 2. Logos (Left: NEMSU, Right: CITE)
  doc.addImage("/logo-nemsu.png", "PNG", 70, 45, 60, 60); 
  doc.addImage("/logo-cite.png", "PNG", width - 130, 45, 60, 60);

  // 3. Header
  doc.setTextColor(255, 255, 255);
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

  // 4. Content
  doc.setTextColor(201, 168, 76); // Gold
  doc.setFontSize(48);
  doc.text("CERTIFICATE OF PARTICIPATION", width / 2, 190, { align: "center" });
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("This certificate is hereby presented to", width / 2, 220, { align: "center" });

  doc.setFontSize(60);
  doc.setFont("helvetica", "bold");
  doc.text(name.toUpperCase(), width / 2, 290, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("for actively participating in the virtual training series entitled:", width / 2, 330, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text("DATA INSIGHTS 2026: NAVIGATING THE DATA MINING FRONTIER", width / 2, 350, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  const eventDate = getDayLabel(day);
  doc.text(`held virtually via Google Meet on ${eventDate}, in recognition of commitment`, width / 2, 370, { align: "center" });
  doc.text("to learning and professional development through active engagement.", width / 2, 385, { align: "center" });

  // 5. Signature
  doc.addImage("/logo-signature.png", "PNG", width / 2 - 50, 460, 100, 50);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("CHRISTINE W. PITOS, MSCS", width / 2, 520, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("BSCS Program Coordinator", width / 2, 535, { align: "center" });

  return doc;
};

const getDayLabel = (day) => {
  const dates = { "1": "April 15, 2026", "2": "April 17, 2026", "3": "April 22, 2026", "4": "April 24, 2026", "5": "April 29, 2026" };
  return dates[day] || "April 2026";
};
