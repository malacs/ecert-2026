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

export const generateCertificate = async (participantName, trainingDay, role = 'Student') => {
  const canvas = document.createElement('canvas');
  const W = 1123; const H = 794;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const [bg, logoNemsu, logoCite, logoSig] = await Promise.all([
    loadImage('/cert-bg.png'),
    loadImage('/logo-nemsu.png'),
    loadImage('/logo-cite.png'),
    loadImage('/logo-signature.png'),
  ]);

  ctx.drawImage(bg, 0, 0, W, H);
  let { day, month, year, time } = DAY_DATES[Number(trainingDay)] || DAY_DATES[1];

  // Draw Logos (Fixed Positions)
  ctx.drawImage(logoNemsu, 210, 80, 90, 90);
  ctx.drawImage(logoCite, 820, 80, 90, 90);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('North Eastern Mindanao State University', W / 2, 110);
  
  ctx.font = 'bold 46px Arial';
  const title = role === 'Speaker' ? 'CERTIFICATE OF RECOGNITION' : 'CERTIFICATE OF PARTICIPATION';
  ctx.fillText(title, W / 2, 250);

  ctx.font = 'bold 52px Arial';
  ctx.fillText(participantName.toUpperCase(), W / 2, 365);

  ctx.font = '14px Arial';
  ctx.fillText(`Held on ${month} ${day}, ${year} from ${time}`, W / 2, 430);

  // Signature
  ctx.drawImage(logoSig, (W / 2) - 50, 600, 100, 60);
  ctx.font = 'bold 14px Arial';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 670);

  const imgData = canvas.toDataURL('image/jpeg', 0.9);
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
