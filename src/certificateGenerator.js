import jsPDF from 'jspdf';

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Load fail: ${src}`));
    img.src = src;
  });

const DAY_DATES = {
  1: { day: 15, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  2: { day: 17, month: 'April', year: 2026, time: '8:30 AM to 12:00 PM' },
  3: { day: 22, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  4: { day: 24, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  5: { day: 29, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
};

// Helper to wrap long body text on the canvas
const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + ' ';
    let metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
};

export const generateCertificate = async (participantName, trainingDay, role = 'Student') => {
  const canvas = document.createElement('canvas');
  const W = 1123; // A4 Landscape width at 96 DPI
  const H = 794;  // A4 Landscape height
  canvas.width = W; 
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Load all assets
  const [bg, logoNemsu, logoCite, logoSig] = await Promise.all([
    loadImage('/cert-bg.png'),
    loadImage('/logo-nemsu.png'),
    loadImage('/logo-cite.png'),
    loadImage('/logo-signature.png'),
  ]);

  // 1. Draw Background
  ctx.drawImage(bg, 0, 0, W, H);

  const data = DAY_DATES[Number(trainingDay)] || DAY_DATES[1];
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';

  // 2. Header Section
  // Logos: NEMSU on Left, CITE on Right
  ctx.drawImage(logoNemsu, 310, 55, 75, 75);
  ctx.drawImage(logoCite, 735, 55, 75, 75);

  ctx.font = '14px Arial';
  ctx.fillText('Republic of the Philippines', W / 2, 70);
  ctx.font = 'bold 18px Arial';
  ctx.fillText('North Eastern Mindanao State University', W / 2, 90);
  ctx.font = '14px Arial';
  ctx.fillText('Lianga Campus', W / 2, 105);
  ctx.font = 'bold 15px Arial';
  ctx.fillText('College of Information Technology Education', W / 2, 135);
  ctx.font = '13px Arial';
  ctx.fillText('Department of Computer Studies', W / 2, 150);

  // 3. Title Section
  ctx.font = 'bold 42px Arial';
  const title = role === 'Speaker' ? 'CERTIFICATE OF RECOGNITION' : 'CERTIFICATE OF PARTICIPATION';
  ctx.fillText(title, W / 2, 245);

  ctx.font = 'italic 18px Georgia';
  ctx.fillText('This certificate is hereby presented to', W / 2, 285);

  // 4. Participant Name
  ctx.font = 'bold 60px "Times New Roman"';
  ctx.fillText(participantName.toUpperCase(), W / 2, 365);

  // 5. Body Paragraph (Wrapped Text)
  ctx.font = '16px Arial';
  const bodyText = `for actively participating in the DATA INSIGHTS 2026: Virtual Training Series on Data Mining Concepts, Techniques, and Applications held virtually via Google Meet on ${data.month} ${data.day}, ${data.year} from ${data.time}, in recognition of commitment to learning and professional development through active engagement in the training sessions.`;
  
  wrapText(ctx, bodyText, W / 2, 435, 750, 22);

  // 6. Given At Date
  ctx.font = '15px Arial';
  ctx.fillText(`Given this ${data.day} of ${data.month}, ${data.year} at North Eastern Mindanao State University — Lianga Campus,`, W / 2, 530);
  ctx.fillText('Lianga, Surigao del Sur.', W / 2, 550);

  // 7. Signature Section (Clean - No Blue Line)
  ctx.drawImage(logoSig, (W / 2) - 60, 580, 120, 70); // Signature over the name
  
  ctx.font = 'bold 18px Arial';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 675);
  
  ctx.font = '14px Arial';
  ctx.fillText('BSCS Program Coordinator', W / 2, 695);

  // Final Output
  const imgData = canvas.toDataURL('image/jpeg', 1.0);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [W, H] });
  pdf.addImage(imgData, 'JPEG', 0, 0, W, H);
  
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
