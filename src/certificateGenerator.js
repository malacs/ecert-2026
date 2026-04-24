import jsPDF from 'jspdf';

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

const getOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// Exact dates and times from reference image context
const DAY_DATES = {
  1: { day: 15, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  2: { day: 17, month: 'April', year: 2026, time: '8:30 AM to 12:00 PM' }, // Day 2 starts late
  3: { day: 22, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  4: { day: 24, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  5: { day: 29, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
};

export const generateCertificate = async (participantName, trainingDay = null, role = 'Student') => {
  // 1. Configure the Canvas with exact A4 Landscape proportions
  const W = 1000;
  const H = 700;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 2. Load Assets (Assuming these exist in your public/ folder)
  const [bg, logoNemsu, logoCite] = await Promise.all([
    loadImage('/cert-bg.png'),
    loadImage('/logo-nemsu.png'),
    loadImage('/logo-cite.png'),
  ]);

  ctx.clearRect(0, 0, W, H);

  // 3. Draw Background (Dark technical theme)
  ctx.drawImage(bg, 0, 0, W, H);

  // Apply subtle color overlay from reference
  ctx.fillStyle = 'rgba(10, 20, 60, 0.15)';
  ctx.fillRect(0, 0, W, H);

  const data = DAY_DATES[Number(trainingDay)] || DAY_DATES[1];

  // 4. Logo Placement Logic (Matches Reference Alignment)
  // THE FIX: Do not use circular clipping. Instead, place them square
  // and align with the "Lianga Campus" text block y-position.
  const logoSize = 100; // Exact size from your reference
  const spacing = 260; // Exact distance from center from your reference
  
  // y = 60 is the start of the logo block and the first text line.
  const logoY = 60; 

  // NEMSU (Left)
  ctx.drawImage(logoNemsu, (W / 2) - spacing - (logoSize / 2), logoY, logoSize, logoSize);
  
  // CITE (Right)
  ctx.drawImage(logoCite, (W / 2) + spacing - (logoSize / 2), logoY, logoSize, logoSize);

  // 5. Text Styling & Content (Exact wording/font sizes from reference)
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff'; // White text theme

  // Header Section
  ctx.font = '13px Arial';
  ctx.fillText('Republic of the Philippines', W / 2, 60);
  ctx.font = 'bold 17px Arial';
  ctx.fillText('North Eastern Mindanao State University', W / 2, 85);
  
  ctx.font = '13px Arial';
  // This is the y-level the logos are aligned to in your reference
  ctx.fillText('Lianga Campus', W / 2, 105); 
  
  ctx.font = 'bold 14px Arial';
  ctx.fillText('College of Information Technology Education', W / 2, 135);
  ctx.font = '13px Arial';
  ctx.fillText('Department of Computer Studies', W / 2, 155);

  // Title Section
  ctx.font = 'bold 38px Arial';
  const titleText = role === 'Speaker' ? 'CERTIFICATE OF RECOGNITION' : 'CERTIFICATE OF PARTICIPATION';
  ctx.fillText(titleText, W / 2, 220);

  ctx.font = 'italic 16px Georgia'; // Serf presentation font
  ctx.fillText('This certificate is hereby presented to', W / 2, 255);

  // 6. Name Placement (Large and bold)
  ctx.font = 'bold 48px Arial';
  ctx.fillText(participantName.toUpperCase(), W / 2, 315);

  // 7. Wording Block (Exact phrasing)
  ctx.font = '14px Arial';
  const bodyY = 360;
  const lineGap = 22;
  ctx.fillText('for actively participating in the DATA INSIGHTS 2026: Virtual Training Series on Data Mining Concepts, Techniques, and Applications', W / 2, bodyY);
  ctx.fillText(`held virtually via Google Meet on ${data.month} ${getOrdinal(data.day)}, ${data.year} from ${data.time}, in recognition of commitment`, W / 2, bodyY + lineGap);
  ctx.fillText('to learning and professional development through active engagement in the training sessions.', W / 2, bodyY + (lineGap * 2));

  // 8. Footer Block
  ctx.font = '14px Arial';
  const footerY = 465;
  ctx.fillText(`Given this ${getOrdinal(data.day)} of ${data.month}, ${data.year} at North Eastern Mindanao State University — Lianga Campus,`, W / 2, footerY);
  ctx.fillText('Surigao del Sur.', W / 2, footerY + 20);

  // 9. Signature Block (Matches reference layout)
  ctx.font = 'bold 16px Arial';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 605);
  ctx.font = '13px Arial';
  ctx.fillText('BSCS Program Coordinator', W / 2, 625);

  // 10. PDF Generation
  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF({ 
    orientation: 'landscape', 
    unit: 'px', 
    format: [W, H], 
    compress: true 
  });
  
  pdf.addImage(imgData, 'PNG', 0, 0, W, H);

  return { pdf, imgData };
};

// Wrapper for direct file download
export const downloadCertificate = async (name, day, role) => {
  const { pdf } = await generateCertificate(name, day, role);
  // Sanitize the filename
  const cleanName = name.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  pdf.save(`Certificate_${cleanName}.pdf`);
};

// Wrapper for website preview
export const getCertificateDataUrl = async (name, day, role) => {
  const { imgData } = await generateCertificate(name, day, role);
  return imgData;
};
