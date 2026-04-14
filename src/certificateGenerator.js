import jsPDF from 'jspdf';

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const getOrdinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const DAY_DATES = {
  1: { day: 15, month: 'April', year: 2026 },
  2: { day: 17, month: 'April', year: 2026 },
  3: { day: 22, month: 'April', year: 2026 },
  4: { day: 24, month: 'April', year: 2026 },
  5: { day: 29, month: 'April', year: 2026 },
  6: { day: 1, month: 'May', year: 2026 },
};

export const generateCertificate = async (participantName, trainingDay = null) => {
  const canvas = document.createElement('canvas');
  const W = 1123;
  const H = 794;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const [bg, logoNemsu, logoCite, logoSig] = await Promise.all([
    loadImage('/cert-bg.png'),
    loadImage('/logo-nemsu.png'),
    loadImage('/logo-cite.png'),
    loadImage('/logo-signature.png'),
  ]);

  // ── BACKGROUND ─────────────────────────────
  ctx.drawImage(bg, 0, 0, W, H);

  ctx.fillStyle = 'rgba(10, 20, 60, 0.65)';
  ctx.fillRect(0, 0, W, H);

  // Glow
  const gradient = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 500);
  gradient.addColorStop(0, 'rgba(255,255,255,0.12)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // ── DATE ─────────────────────────────
  let day, month, year;
  if (trainingDay && DAY_DATES[parseInt(trainingDay)]) {
    const d = DAY_DATES[parseInt(trainingDay)];
    day = d.day;
    month = d.month;
    year = d.year;
  } else {
    const now = new Date();
    day = now.getDate();
    month = now.toLocaleString('default', { month: 'long' });
    year = now.getFullYear();
  }

  ctx.textAlign = 'center';

  // ── LOGOS (FIXED CENTERED) ─────────────────────────────
  const logoHeight = 65;

  const nemsuWidth = (logoNemsu.width / logoNemsu.height) * logoHeight;
  const citeWidth = (logoCite.width / logoCite.height) * logoHeight;

  const centerX = W / 2;
  const gap = 180;
  const logoY = 50;

  ctx.drawImage(
    logoNemsu,
    centerX - gap - nemsuWidth / 2,
    logoY,
    nemsuWidth,
    logoHeight
  );

  ctx.drawImage(
    logoCite,
    centerX + gap - citeWidth / 2,
    logoY,
    citeWidth,
    logoHeight
  );

  // ── HEADER ─────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.fillText('Republic of the Philippines', W / 2, 80);

  ctx.font = 'bold 14px Arial';
  ctx.fillText('North Eastern Mindanao State University', W / 2, 105);

  ctx.font = '12px Arial';
  ctx.fillText('Lianga Campus', W / 2, 125);

  ctx.font = 'bold 12px Arial';
  ctx.fillText('College of Information Technology Education', W / 2, 155);
  ctx.fillText('Department of Computer Studies', W / 2, 175);

  // ── TITLE ─────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px Calibri, Arial';
  ctx.fillText('CERTIFICATE OF PARTICIPATION', W / 2, 240);

  // ── SUBTEXT ─────────────────────────────
  ctx.fillStyle = '#d6e6ff';
  ctx.font = '12px Arial';
  ctx.fillText('This certificate is hereby presented to', W / 2, 280);

  // ── NAME ─────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.font = '48px "Lucida Calligraphy", cursive';
  ctx.fillText(participantName.toUpperCase(), W / 2, 350);

  // ── BODY ─────────────────────────────
  ctx.fillStyle = '#d6e6ff';
  ctx.font = '12px Arial';

  ctx.fillText(
    'for actively participating in the DATA INSIGHTS 2026: Virtual Training Series on Data Mining Concepts, Techniques, and Applications',
    W / 2,
    400
  );

  ctx.fillText(
    'held virtually via Google Meet on April 15, 17, 22, 24, 29 & May 1, 2026 from 8:00 AM to 12:00 PM, in recognition of commitment',
    W / 2,
    420
  );

  ctx.fillText(
    'to learning and professional development through active engagement in the training sessions.',
    W / 2,
    440
  );

  // ── GIVEN DATE ─────────────────────────────
  ctx.fillText(
    `Given this ${getOrdinal(day)} of ${month}, ${year} at North Eastern Mindanao State University – Lianga Campus,`,
    W / 2,
    480
  );

  ctx.fillText('Lianga, Surigao del Sur', W / 2, 500);

  // ── SIGNATURE ─────────────────────────────
  ctx.drawImage(logoSig, W / 2 - 60, 540, 120, 80);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Arial';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 640);

  ctx.fillStyle = '#d6e6ff';
  ctx.font = '12px Arial';
  ctx.fillText('BSCS Program Coordinator', W / 2, 660);

  // ── EXPORT ─────────────────────────────
  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [W, H],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, W, H);

  return { pdf, imgData };
};

export const downloadCertificate = async (participantName, trainingDay = null) => {
  const { pdf } = await generateCertificate(participantName, trainingDay);
  pdf.save(`Certificate_${participantName.replace(/\s+/g, '_')}.pdf`);
};

export const getCertificateDataUrl = async (participantName, trainingDay = null) => {
  const { imgData } = await generateCertificate(participantName, trainingDay);
  return imgData;
};
