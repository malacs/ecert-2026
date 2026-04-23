import { jsPDF } from "jspdf";

export const getCertificateDataUrl = async (name, day, role = 'Student') => {
  return new Promise((resolve) => {
    const doc = generateBaseDoc(name, day, role);
    // Use a small timeout to ensure images are processed
    setTimeout(() => {
      resolve(doc.output("datauristring"));
    }, 100);
  });
};

export const downloadCertificate = async (name, day, role = 'Student') => {
  const doc = generateBaseDoc(name, day, role);
  doc.save(`Data_Insights_2026_${name.replace(/\s+/g, '_')}.pdf`);
};

const generateBaseDoc = (name, day, role) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [1123, 794], 
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // 1. Load the Dark Data Background
  // Paths assume these are in your 'public' folder
  doc.addImage("/cert-bg.png", "PNG", 0, 0, width, height);

  // 2. Add University & College Logos
  // NEMSU on Left, CITE on Right as requested
  doc.addImage("/logo-nemsu.png", "PNG", 310, 40, 70, 70); 
  doc.addImage("/logo-cite.png", "PNG", 740, 40, 70, 70);

  // 3. Header Text (White/Gold Theme)
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("Republic of the Philippines", width / 2, 45, { align: "center" });
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("North Eastern Mindanao State University", width / 2, 65, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("Lianga Campus", width / 2, 80, { align: "center" });

  doc.setFontSize(16);
  doc.text("College of Information Technology Education", width / 2, 105, { align: "center" });
  doc.setFontSize(12);
  doc.text("Department of Computer Studies", width / 2, 120, { align: "center" });

  // 4. Certificate Title
  doc.setFontSize(48);
  doc.text("CERTIFICATE OF PARTICIPATION", width / 2, 180, { align: "center" });
  
  doc.setFontSize(14);
  doc.text("This certificate is hereby presented to", width / 2, 205, { align: "center" });

  // 5. Participant Name (Large & Bold)
  doc.setFontSize(65);
  doc.setFont("helvetica", "bolditalic");
  doc.text(name.toUpperCase(), width / 2, 280, { align: "center" });

  // 6. Event Description
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  const description = [
    "for actively participating in the DATA INSIGHTS 2026: Virtual Training Series on Data Mining Concepts, Techniques, and Applications",
    `held virtually via Google Meet on ${getDayLabel(day)}, in recognition of commitment`,
    "to learning and professional development through active engagement in the training sessions."
  ];
  doc.text(description[0], width / 2, 330, { align: "center" });
  doc.text(description[1], width / 2, 345, { align: "center" });
  doc.text(description[2], width / 2, 360, { align: "center" });

  // 7. Date and Location Footer
  doc.setFontSize(12);
  doc.text(`Given this ${getDayLabel(day)} at North Eastern Mindanao State University – Lianga Campus,`, width / 2, 410, { align: "center" });
  doc.text("Lianga, Surigao del Sur", width / 2, 425, { align: "center" });

  // 8. Instructor Signature
  // Note: Removed the blue line as per previous request
  doc.addImage("/logo-signature.png", "PNG", width / 2 - 40, 450, 80, 45);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CHRISTINE W. PITOS, MSCS", width / 2, 505, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("BSCS Program Coordinator", width / 2, 518, { align: "center" });

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
