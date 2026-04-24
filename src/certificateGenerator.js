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

const DAY_DATES = {
  1: { day: 15, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  2: { day: 17, month: 'April', year: 2026, time: '8:30 AM to 12:00 PM' },
  3: { day: 22, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  4: { day: 24, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  5: { day: 29, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
};

export const generateCertificate = async (participantName, trainingDay = null, role = 'Student') => {
  const W = 1000;
  const H = 700;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const [bg, logoNemsu, logoCite] = await Promise.all([
    loadImage('/cert-bg.png'),
    loadImage('/logo-nemsu.png'),
    loadImage('/logo-cite.png'),
  ]);

  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(bg, 0, 0, W, H);

  const data = DAY_DATES[Number(trainingDay)] || DAY_DATES[1];

  // --- LOGO PLACEMENT (Circular & Tighter Spacing) ---
  const logoSize = 85; 
  const spacing = 245; // Reduced from 280 to bring logos closer to words
  const logoY = 50;

  const drawCircularLogo = (img, centerX) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip(); // Creates the perfect circular frame
    ctx.drawImage(img, centerX - logoSize / 2, logoY, logoSize, logoSize);
    ctx.restore();
  };

  // NEMSU (Left) & CITE (Right)
  drawCircularLogo(logoNemsu, (W / 2) - spacing);
  drawCircularLogo(logoCite, (W / 2) + spacing);

  // --- TEXT CONTENT ---
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';

  ctx.font = '13px Arial';
  ctx.fillText('Republic of the Philippines', W / 2, 60);
  ctx.font = 'bold 17px Arial';
  ctx.fillText('North Eastern Mindanao State University', W / 2, 85);
  ctx.font = '13px Arial';
  ctx.fillText('Lianga Campus', W / 2, 105); 
  
  ctx.font = 'bold 14px Arial';
  ctx.fillText('College of Information Technology Education', W / 2, 135);
  ctx.font = '13px Arial';
  ctx.fillText('Department of Computer Studies', W / 2, 155);

  ctx.font = 'bold 38px Arial';
  const titleText = role === 'Speaker' ? 'CERTIFICATE OF RECOGNITION' : 'CERTIFICATE OF PARTICIPATION';
  ctx.fillText(titleText, W / 2, 220);

  ctx.font = 'italic 16px Georgia';
  ctx.fillText('This certificate is hereby presented to', W / 2, 255);

  // Participant Name
  ctx.font = 'bold 48px Arial';
  ctx.fillText(participantName.toUpperCase(), W / 2, 315);

  // Body Text
  ctx.font = '14px Arial';
  const bodyY = 360;
  const lineGap = 22;
  ctx.fillText('for actively participating in the DATA INSIGHTS 2026: Virtual Training Series on Data Mining Concepts, Techniques, and Applications', W / 2, bodyY);
  ctx.fillText(`held virtually via Google Meet on ${data.month} ${getOrdinal(data.day)}, ${data.year} from ${data.time}`, W / 2, bodyY + lineGap);
  ctx.fillText('in recognition of commitment to learning and professional development.', W / 2, bodyY + (lineGap * 2));

  // Location/Date
  ctx.font = '14px Arial';
  const footerY = 465;
  ctx.fillText(`Given this ${getOrdinal(data.day)} of ${data.month}, ${data.year} at NEMSU — Lianga Campus,`, W / 2, footerY);
  ctx.fillText('Surigao del Sur.', W / 2, footerY + 20);

  // --- SIGNATURE SECTION (Fixed visibility) ---
  // Moved up slightly and ensured high-contrast bold font
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Arial'; 
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 595);
  
  // Underline logic (optional, clean)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo((W / 2) - 120, 600);
  ctx.lineTo((W / 2) + 120, 600);
  ctx.stroke();

  ctx.font = '14px Arial';
  ctx.fillText('BSCS Program Coordinator', W / 2, 618);

  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [W, H] });
  pdf.addImage(imgData, 'PNG', 0, 0, W, H);

  return { pdf, imgData };
};

export const downloadCertificate = async (name, day, role) => {
  const { pdf } = await generateCertificate(name, day, role);
  pdf.save(`Certificate_${name.replace(/\s+/g, '_')}.pdf`);
};

export const getCertificateDataUrl = async (name, day, role) => {
  const { imgData } = await generateCertificate(name, day, role);
  return imgData;
};
