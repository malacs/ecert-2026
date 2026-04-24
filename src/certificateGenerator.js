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

const getGoldSignature = (image) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = image.width; canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = '#c9a84c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
};

export const generateCertificate = async (participantName, trainingDay, role) => {
  const W = 1000; const H = 700;
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
  const data = DAY_DATES[Number(trainingDay)] || DAY_DATES[1];

  // Logos
  ctx.drawImage(logoNemsu, 240, 60, 100, 100);
  ctx.drawImage(logoCite, 660, 60, 100, 100);

  // Wording
  ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
  ctx.font = 'bold 38px Arial';
  ctx.fillText('CERTIFICATE OF PARTICIPATION', W/2, 220);
  ctx.font = 'italic 16px Georgia';
  ctx.fillText('This certificate is hereby presented to', W/2, 255);
  ctx.font = 'bold 48px Arial';
  ctx.fillText(participantName.toUpperCase(), W/2, 315);

  ctx.font = '14px Arial';
  ctx.fillText(`held virtually via Google Meet on ${data.month} ${getOrdinal(data.day)}, ${data.year}`, W/2, 382);

  // Gold Signature
  const goldSig = getGoldSignature(logoSig);
  ctx.drawImage(goldSig, 450, 525, 100, 55);
  ctx.font = 'bold 16px Arial';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W/2, 605);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [W, H] });
  pdf.addImage(imgData, 'PNG', 0, 0, W, H);
  return { pdf, imgData };
};

export const downloadCertificate = async (n, d, r) => {
  const { pdf } = await generateCertificate(n, d, r);
  pdf.save(`${n}.pdf`);
};

export const getCertificateDataUrl = async (n, d, r) => {
  const { imgData } = await generateCertificate(n, d, r);
  return imgData;
};
