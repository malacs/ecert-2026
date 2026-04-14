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

// ✅ SUPERSCRIPT FIX
const drawOrdinalInline = (ctx, x, y, number) => {
  const baseFont = ctx.font;
  const smallFont = baseFont.replace(/\d+px/, '9px');

  const n = number.toString();
  const suffix = getOrdinal(number).replace(n, '');

  ctx.fillText(n, x, y);
  const width = ctx.measureText(n).width;

  ctx.font = smallFont;
  ctx.fillText(suffix, x + width, y - 6);

  ctx.font = baseFont;
  return width + ctx.measureText(suffix).width;
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

  // ── BACKGROUND (UNCHANGED) ─────────────────────────
  ctx.drawImage(bg, 0, 0, W, H);

  ctx.fillStyle = 'rgba(10, 20, 60, 0.65)';
  ctx.fillRect(0, 0, W, H);

  // ── DATE ─────────────────────────
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

  // ── HEADER TEXT (UNCHANGED) ─────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.font = '500 14px Georgia, serif';
  ctx.fillText('Republic of the Philippines', W / 2, 85);

  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText('North Eastern Mindanao State University', W / 2, 110);

  ctx.font = '13px Georgia, serif';
  ctx.fillText('Lianga Campus', W / 2, 140);

  // ── LOGOS (FIXED ALIGNMENT WITH LIANGA CAMPUS) ─────
  const logoHeight = 70;

  const nemsuWidth = (logoNemsu.width / logoNemsu.height) * logoHeight;
  const citeWidth = (logoCite.width / logoCite.height) * logoHeight;

  // Align bottom of logos with "Lianga Campus" (y = 140)
  const logoY = 140 - logoHeight;

  const centerX = W / 2;
  const gap = 180;

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

  // Remaining header
  ctx.font = 'bold 12px Georgia, serif';
  ctx.fillText('College of Information Technology Education', W / 2, 170);
  ctx.fillText('Department of Computer Studies', W / 2, 190);

  // ── TITLE (UNCHANGED) ─────────────────────────
  ctx.font = 'bold 46px Georgia, serif';
  ctx.fillText('CERTIFICATE OF PARTICIPATION', W / 2, 260);

  ctx.font = 'italic 16px Georgia, serif';
  ctx.fillText('This certificate is hereby presented to', W / 2, 300);

  // ── NAME (UNCHANGED) ─────────────────────────
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText(participantName.toUpperCase(), W / 2, 390);

  // ── BODY (UNCHANGED) ─────────────────────────
  ctx.font = '13.5px Georgia, serif';
  ctx.fillText(
    'for actively participating in the DATA INSIGHTS 2026: Virtual Training Series on Data Mining Concepts, Techniques,',
    W / 2,
    440
  );
  ctx.fillText('and Applications', W / 2, 460);

  ctx.fillText(
    'held virtually via Google Meet on April 15, 17, 22, 24, 29 & May 1, 2026 from 8:00 AM to 12:00 PM, in recognition of commitment',
    W / 2,
    485
  );

  ctx.fillText(
    'to learning and professional development through active engagement in the training sessions.',
    W / 2,
    505
  );

  // ── GIVEN DATE (FIXED ONLY THIS) ─────────────────────────
  ctx.font = '13.5px Georgia, serif';
  ctx.textAlign = 'center';

  const part1 = 'Given this ';
  const part2 = ` of ${month}, ${year} at `;
  const part3 =
    'North Eastern Mindanao State University – Lianga Campus,';

  const totalWidth =
    ctx.measureText(part1).width +
    ctx.measureText(getOrdinal(day)).width +
    ctx.measureText(part2).width +
    ctx.measureText(part3).width;

  let x = W / 2 - totalWidth / 2;

  ctx.fillStyle = 'rgba(200,220,255,0.9)';
  ctx.textAlign = 'left';
  ctx.fillText(part1, x, 540);
  x += ctx.measureText(part1).width;

  // DAY (white + superscript)
  ctx.fillStyle = '#ffffff';
  x += drawOrdinalInline(ctx, x, 540, day);

  // normal
  ctx.fillStyle = 'rgba(200,220,255,0.9)';
  ctx.fillText(part2, x, 540);
  x += ctx.measureText(part2).width;

  // UNIVERSITY WHITE
  ctx.fillStyle = '#ffffff';
  ctx.fillText(part3, x, 540);

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(200,220,255,0.9)';
  ctx.fillText('Lianga, Surigao del Sur', W / 2, 560);

  // ── SIGNATURE (UNCHANGED) ─────────────────────────
  ctx.drawImage(logoSig, W / 2 - 50, 600, 100, 73);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 690);

  ctx.font = 'italic 11px Georgia, serif';
  ctx.fillText('BSCS Program Coordinator', W / 2, 710);

  // ── EXPORT ─────────────────────────
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
