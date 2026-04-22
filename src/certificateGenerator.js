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

export const generateCertificate = async (participantName, trainingDay = 1, role = 'Student') => {
  const canvas = document.createElement('canvas');

  // 📱 LOWER RESOLUTION FOR MOBILE FIX
  const W = 900;
  const H = 650;

  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');

  const [bg] = await Promise.all([
    loadImage('/cert-bg.png'),
  ]);

  ctx.drawImage(bg, 0, 0, W, H);

  const { day, month, year } = DAY_DATES[Number(trainingDay)] || DAY_DATES[1];

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';

  ctx.font = 'bold 28px Arial';
  ctx.fillText(
    role === 'Speaker'
      ? 'CERTIFICATE OF RECOGNITION'
      : 'CERTIFICATE OF PARTICIPATION',
    W / 2,
    120
  );

  ctx.font = '16px Arial';
  ctx.fillText('Presented to', W / 2, 180);

  ctx.font = 'bold 32px Arial';
  ctx.fillText(participantName.toUpperCase(), W / 2, 240);

  ctx.font = '14px Arial';
  ctx.fillText(
    `Held on ${month} ${day}, ${year}`,
    W / 2,
    300
  );

  // ⚡ LIGHTER IMAGE (FIX MOBILE CRASH)
  const imgData = canvas.toDataURL('image/jpeg', 0.8);

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [W, H],
  });

  pdf.addImage(imgData, 'JPEG', 0, 0, W, H);

  return { pdf, imgData };
};

export const downloadCertificate = async (participantName, trainingDay, role) => {
  const { pdf } = await generateCertificate(participantName, trainingDay, role);
  pdf.save(`Certificate_${participantName}.pdf`);
};

export const getCertificateDataUrl = async (participantName, trainingDay, role) => {
  const { imgData } = await generateCertificate(participantName, trainingDay, role);
  return imgData;
};
