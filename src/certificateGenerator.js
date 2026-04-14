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
  6: { day: 1,  month: 'May',   year: 2026 },
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

  // ── BACKGROUND (REFERENCE STYLE) ─────────────────────────────
  ctx.drawImage(bg, 0, 0, W, H);

  // Dark blue overlay
  ctx.fillStyle = 'rgba(10, 20, 60, 0.65)';
  ctx.fillRect(0, 0, W, H);

  // Center glow (frosted feel)
  const gradient = ctx.createRadialGradient(
    W / 2, H / 2, 100,
    W / 2, H / 2, 500
  );
  gradient.addColorStop(0, 'rgba(255,255,255,0.12)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.06)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // Bottom glow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 150, 255, 0.4)';
  ctx.shadowBlur = 120;
  ctx.fillStyle = 'rgba(0, 150, 255, 0.05)';
  ctx.fillRect(0, H * 0.6, W, H * 0.4);
  ctx.restore();

  // ── DATE ───────────────────────────────────────────────────
  let day, month, year;
  if (trainingDay && DAY_DATES[parseInt(trainingDay)]) {
    const d = DAY_DATES[parseInt(trainingDay)];
    day = d.day; month = d.month; year = d.year;
  } else {
    const now = new Date();
    day = now.getDate();
    const mNames = ['January','February','March','April','May','June',
      'July','August','September','October','November','December'];
    month = mNames[now.getMonth()];
    year = now.getFullYear();
  }

  ctx.textAlign = 'center';

  // ── HEADER (FIXED SPACING) ─────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '500 14px Georgia, serif';
  ctx.fillText('Republic of the Philippines', W / 2, 85);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Georgia, serif';
  const universityTitle = 'North Eastern Mindanao State University';
  ctx.fillText(universityTitle, W / 2, 110);

  // ── LOGOS (FIXED) ─────────────────────────────────────
  const logoHeight = 70;

  const nemsuRatio = logoNemsu.width / logoNemsu.height;
  const citeRatio  = logoCite.width / logoCite.height;

  const nemsuWidth = logoHeight * nemsuRatio;
  const citeWidth  = logoHeight * citeRatio;

  const spacing = 60;
  const textWidth = ctx.measureText(universityTitle).width;

  const leftLogoX  = (W / 2) - (textWidth / 2) - nemsuWidth - spacing;
  const rightLogoX = (W / 2) + (textWidth / 2) + spacing;

  const logoY = 60;

  ctx.drawImage(logoNemsu, leftLogoX, logoY, nemsuWidth, logoHeight);
  ctx.drawImage(logoCite, rightLogoX, logoY, citeWidth, logoHeight);

  // Remaining header
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '13px Georgia, serif';
  ctx.fillText('Lianga Campus', W / 2, 140);

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.fillText('College of Information Technology Education', W / 2, 170);
  ctx.fillText('Department of Computer Studies', W / 2, 190);

  // ── TITLE ─────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 46px Georgia, serif';
  ctx.fillText('CERTIFICATE OF PARTICIPATION', W / 2, 260);

  ctx.fillStyle = 'rgba(200,222,255,0.9)';
  ctx.font = 'italic 16px Georgia, serif';
  ctx.fillText('This certificate is hereby presented to', W / 2, 300);

  // ── NAME ─────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.shadowColor = 'rgba(100,180,255,0.8)';
  ctx.shadowBlur = 20;
  ctx.fillText(participantName.toUpperCase(), W / 2, 390);
  ctx.shadowBlur = 0;

  // ── BODY ─────────────────────────────────────────────
  ctx.fillStyle = 'rgba(200,220,255,0.9)';
  ctx.font = '13.5px Georgia, serif';
  ctx.fillText('for actively participating in the DATA INSIGHTS 2026: Virtual Training Series on Data Mining Concepts, Techniques,', W / 2, 440);
  ctx.fillText('and Applications', W / 2, 460);
  ctx.fillText('held virtually via Google Meet on April 15, 17, 22, 24, 29 & May 1, 2026 from 8:00 AM to 12:00 PM, in recognition of commitment', W / 2, 485);
  ctx.fillText('to learning and professional development through active engagement in the training sessions.', W / 2, 505);

  // ── GIVEN THIS ───────────────────────────────────────
  const nFont = '13.5px Georgia, serif';
  const bFont = 'bold 13.5px Georgia, serif';

  const parts = [
    { text: 'Given this ', bold: false },
    { text: `${getOrdinal(day)} of ${month}, ${year}`, bold: true },
    { text: ' at ', bold: false },
    { text: 'North Eastern Mindanao State University – Lianga Campus,', bold: true },
  ];

  let tw = 0;
  parts.forEach(p => { ctx.font = p.bold ? bFont : nFont; tw += ctx.measureText(p.text).width; });

  let gx = W / 2 - tw / 2;

  parts.forEach(p => {
    ctx.font = p.bold ? bFont : nFont;
    ctx.fillStyle = 'rgba(200,220,255,0.9)';
    ctx.textAlign = 'left';
    ctx.fillText(p.text, gx, 540);
    gx += ctx.measureText(p.text).width;
  });

  ctx.textAlign = 'center';
  ctx.fillText('Lianga, Surigao del Sur', W / 2, 560);

  // ── SIGNATURE ───────────────────────────────────────
  ctx.globalAlpha = 0.9;
  ctx.drawImage(logoSig, W / 2 - 50, 600, 100, 73);
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 690);

  ctx.fillStyle = 'rgba(200,220,255,0.85)';
  ctx.font = 'italic 11px Georgia, serif';
  ctx.fillText('BSCS Program Coordinator', W / 2, 710);

  // ── EXPORT ─────────────────────────────────────────
  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [W, H] });
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
