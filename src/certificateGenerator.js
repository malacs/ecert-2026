import jsPDF from 'jspdf';

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });

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

  const [bg, logoNemsu, logoCite, logoSig] = await Promise.all([
    loadImage('/cert-bg.png'),
    loadImage('/logo-nemsu.png'),
    loadImage('/logo-cite.png'),
    loadImage('/logo-signature.png'),
  ]);

  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(bg, 0, 0, W, H);
  
  const dateInfo = DAY_DATES[Number(trainingDay)] || DAY_DATES[1];

  // Logos
  ctx.drawImage(logoNemsu, 280, 80, 80, 80);
  ctx.drawImage(logoCite, 640, 80, 80, 80);

  // Text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('North Eastern Mindanao State University', W / 2, 85);
  ctx.font = '13px Arial';
  ctx.fillText('Lianga Campus', W / 2, 105);

  // Title
  ctx.font = 'bold 38px Arial';
  ctx.fillText(role === 'Speaker' ? 'CERTIFICATE OF RECOGNITION' : 'CERTIFICATE OF PARTICIPATION', W / 2, 210);

  // Name (Ensure it is Uppercase)
  ctx.font = 'bold 42px Arial';
  ctx.fillText(participantName.toUpperCase(), W / 2, 310);

  // Body
  ctx.font = '14px Arial';
  ctx.fillText(`Held on ${dateInfo.month} ${dateInfo.day}, ${dateInfo.year} from ${dateInfo.time}`, W / 2, 360);

  // Signature (Gold Tinting)
  const sigCanv = document.createElement('canvas');
  sigCanv.width = 120; sigCanv.height = 70;
  const sCtx = sigCanv.getContext('2d');
  sCtx.drawImage(logoSig, 0, 0, 120, 70);
  sCtx.globalCompositeOperation = 'source-atop';
  sCtx.fillStyle = '#C9A84C';
  sCtx.fillRect(0,0, 120, 70);
  ctx.drawImage(sigCanv, W / 2 - 60, 500);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 590);

  // Mobile Safe Output
  const imgData = canvas.toDataURL('image/jpeg', 0.8);
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
