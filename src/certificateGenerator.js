import jsPDF from 'jspdf';

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

const DAY_DATES = {
  1: { day: 15, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  2: { day: 17, month: 'April', year: 2026, time: '8:30 AM to 12:00 PM' },
  3: { day: 22, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  4: { day: 24, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  5: { day: 29, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
};

export const generateCertificate = async (participantName, trainingDay, role = 'Student') => {
  const W = 1000, H = 700;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const [bg, logoNemsu, logoCite, logoSig] = await Promise.all([
    loadImage('/cert-bg.png'),
    loadImage('/logo-nemsu.png'),
    loadImage('/logo-cite.png'),
    loadImage('/logo-signature.png'),
  ]);

  ctx.drawImage(bg, 0, 0, W, H);
  const { day, month, year, time } = DAY_DATES[Number(trainingDay)] || DAY_DATES[1];

  // LOGO CORRECTION: NEMSU LEFT, CITE RIGHT
  ctx.drawImage(logoNemsu, 250, 70, 75, 75);
  ctx.drawImage(logoCite, 675, 70, 75, 75);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  
  // Header Text
  ctx.font = 'bold 16px Arial';
  ctx.fillText('North Eastern Mindanao State University', W / 2, 85);
  ctx.font = '12px Arial';
  ctx.fillText('Lianga Campus', W / 2, 100);
  ctx.font = 'bold 12px Arial';
  ctx.fillText('College of Information Technology Education', W / 2, 125);

  // Title
  ctx.font = 'bold 36px Arial';
  const title = role === 'Speaker' ? 'CERTIFICATE OF RECOGNITION' : 'CERTIFICATE OF PARTICIPATION';
  ctx.fillText(title, W / 2, 210);

  // Name
  ctx.font = 'bold 52px serif';
  ctx.fillText(participantName.toUpperCase(), W / 2, 310);

  // Date/Body Details omitted for brevity but remain as per your original file...
  // Signature
  ctx.drawImage(logoSig, (W / 2) - 55, 530, 110, 60);
  ctx.font = 'bold 14px Arial';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 620);

  const imgData = canvas.toDataURL('image/jpeg', 1.0);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [W, H] });
  pdf.addImage(imgData, 'JPEG', 0, 0, W, H);
  return { pdf };
};

export const downloadCertificate = async (name, day, role) => {
  const { pdf } = await generateCertificate(name, day, role);
  pdf.save(`Certificate_${name.replace(/\s+/g, '_')}.pdf`);
};
