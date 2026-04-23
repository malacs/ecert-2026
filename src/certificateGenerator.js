import jsPDF from 'jspdf';

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

// Helper to get ordinal suffix (15th, 22nd, etc.)
const getOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
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
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = '#c9a84c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
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

  // BACKGROUND
  ctx.drawImage(bg, 0, 0, W, H);
  ctx.fillStyle = 'rgba(10, 20, 60, 0.15)';
  ctx.fillRect(0, 0, W, H);

  const data = DAY_DATES[Number(trainingDay)] || DAY_DATES[1];

  // LOGOS (FIXED SIZE + NO DISTORTION)
  const maxLogoSize = 85; // Slightly increased for visibility
  const logoY = 65;
  const spacing = 240;

  const drawLogo = (img, centerX) => {
    const aspect = img.width / img.height;
    let drawW, drawH;
    if (aspect > 1) {
      drawW = maxLogoSize;
      drawH = maxLogoSize / aspect;
    } else {
      drawH = maxLogoSize;
      drawW = maxLogoSize * aspect;
    }
    ctx.drawImage(img, centerX - drawW / 2, logoY, drawW, drawH);
  };

  drawLogo(logoNemsu, (W / 2) - spacing);
  drawLogo(logoCite, (W / 2) + spacing);

  // HEADER
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

  // TITLE
  ctx.font = 'bold 38px Arial';
  const title = role === 'Speaker' ? 'CERTIFICATE OF RECOGNITION' : 'CERTIFICATE OF PARTICIPATION';
  ctx.fillText(title, W / 2, 220);

  ctx.font = 'italic 16px Georgia';
  ctx.fillText('This certificate is hereby presented to', W / 2, 255);

  // PARTICIPANT NAME
  ctx.font = 'bold 48px Arial';
  ctx.fillText(participantName.toUpperCase(), W / 2, 315);

  // BODY (MOVED UPWARD - bodyY changed from 380 to 365)
  ctx.font = '14px Arial';
  const bodyY = 365; 
  const lineGap = 22;

  ctx.fillText('for actively participating in the DATA INSIGHTS 2026: Virtual Training Series on Data Mining Concepts, Techniques, and Applications', W / 2, bodyY);
  ctx.fillText(`held virtually via Google Meet on ${data.month} ${data.day}, ${data.year} from ${data.time}, in recognition of commitment`, W / 2, bodyY + lineGap);
  ctx.fillText('to learning and professional development through active engagement in the training sessions.', W / 2, bodyY + (lineGap * 2));

  // FOOTER (With Ordinal Suffix)
  ctx.font = '14px Arial';
  const ordinalDay = getOrdinal(data.day);
  ctx.fillText(`Given this ${ordinalDay} of ${data.month}, ${data.year} at North Eastern Mindanao State University — Lianga Campus,`, W / 2, 480);
  ctx.fillText('Lianga, Surigao del Sur.', W / 2, 500);

  // SIGNATURE
  const goldSigCanvas = getGoldSignature(logoSig);
  ctx.drawImage(goldSigCanvas, (W / 2) - 60, 535, 120, 65);

  ctx.font = 'bold 16px Arial';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 620);
  ctx.font = '13px Arial';
  ctx.fillText('BSCS Program Coordinator', W / 2, 640);

  // EXPORT
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
