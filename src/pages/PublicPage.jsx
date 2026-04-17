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

const drawOrdinalInline = (ctx, x, y, number) => {
  const baseFont = ctx.font;
  const smallFont = baseFont.replace(/\d+px/, '10px'); // Slightly larger for readability
  const n = number.toString();
  const suffix = getOrdinal(number).replace(n, '');
  ctx.fillText(n, x, y);
  const width = ctx.measureText(n).width;
  ctx.font = smallFont;
  ctx.fillText(suffix, x + width, y - 7);
  ctx.font = baseFont;
  return width + ctx.measureText(suffix).width;
};

const fitTextToWidth = (ctx, text, maxWidth, initialSize, fontFamily) => {
  let fontSize = initialSize;
  do {
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    fontSize--;
  } while (ctx.measureText(text).width > maxWidth && fontSize > 24);
  return fontSize;
};

const DAY_DATES = {
  1: { day: 15, month: 'April', year: 2026 },
  2: { day: 17, month: 'April', year: 2026 },
  3: { day: 22, month: 'April', year: 2026 },
  4: { day: 24, month: 'April', year: 2026 },
  5: { day: 29, month: 'April', year: 2026 },
};

export const generateCertificate = async (participantName, trainingDay = null) => {
  const canvas = document.createElement('canvas');
  const W = 1123; // A4 Landscape at 96 DPI
  const H = 794;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Load Assets
  const [bg, logoNemsu, logoCite, logoSig] = await Promise.all([
    loadImage('/cert-bg.png'),
    loadImage('/logo-nemsu.png'),
    loadImage('/logo-cite.png'),
    loadImage('/logo-signature.png'),
  ]);

  // Session Date Logic
  const selected = Number(trainingDay);
  const session = DAY_DATES[selected] || DAY_DATES[1];
  const { day: sDay, month: sMonth, year: sYear } = session;

  // Render Background
  ctx.drawImage(bg, 0, 0, W, H);
  ctx.fillStyle = 'rgba(10, 20, 60, 0.3)'; // Slightly deeper overlay for professional contrast
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  // --- LOGO SECTION ---
  const logoHeight = 80;
  const logoTop = 70;
  const nemsuWidth = logoHeight * (logoNemsu.width / logoNemsu.height);
  const citeWidth = logoHeight * (logoCite.width / logoCite.height);
  const logoSpacing = 240;

  ctx.drawImage(logoNemsu, (W / 2) - logoSpacing - nemsuWidth / 2, logoTop, nemsuWidth, logoHeight);
  ctx.drawImage(logoCite, (W / 2) + logoSpacing - citeWidth / 2, logoTop, citeWidth, logoHeight);

  // --- INSTITUTIONAL HEADER ---
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px Arial';
  ctx.fillText('Republic of the Philippines', W / 2, 85);
  ctx.font = 'bold 18px Arial';
  ctx.fillText('North Eastern Mindanao State University', W / 2, 110);
  ctx.font = '14px Arial';
  ctx.fillText('Lianga Campus', W / 2, 135);

  ctx.font = 'bold 14px Arial';
  ctx.fillText('College of Information Technology Education', W / 2, 170);
  ctx.fillText('Department of Computer Studies', W / 2, 190);

  // --- MAIN TITLE ---
  ctx.font = 'bold 48px Calibri, Arial';
  ctx.fillText('CERTIFICATE OF PARTICIPATION', W / 2, 260);

  ctx.fillStyle = '#d6e6ff';
  ctx.font = 'italic 16px Arial';
  ctx.fillText('This certificate is hereby presented to', W / 2, 285);

  // --- PARTICIPANT NAME ---
  ctx.fillStyle = '#ffffff';
  const nameText = participantName.toUpperCase();
  const fontSize = fitTextToWidth(ctx, nameText, W - 200, 56, 'Calibri, Arial');
  ctx.font = `bold ${fontSize}px Calibri, Arial`;
  ctx.fillText(nameText, W / 2, 370);

  // --- BODY TEXT ---
  ctx.fillStyle = '#d6e6ff';
  ctx.font = '15px Arial';
  const lineGap = 24;
  const bodyY = 420;

  ctx.fillText('for actively participating in the DATA INSIGHTS 2026: Virtual Training Series on Data Mining Concepts,', W / 2, bodyY);
  ctx.fillText(`Techniques, and Applications held virtually via Google Meet on ${sMonth} ${sDay}, ${sYear}`, W / 2, bodyY + lineGap);
  ctx.fillText('from 8:00 AM to 12:00 PM, in recognition of commitment to learning and professional development.', W / 2, bodyY + lineGap * 2);

  // --- FORMAL GIVEN SECTION ---
  const yGiven = 520;
  const part1 = 'Given this ';
  const part2 = ` of ${sMonth}, ${sYear} at North Eastern Mindanao State University – Lianga Campus,`;
  
  ctx.font = '15px Arial';
  const totalW = ctx.measureText(part1).width + 35 + ctx.measureText(part2).width;
  let startX = (W / 2) - (totalW / 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#d6e6ff';
  ctx.fillText(part1, startX, yGiven);
  startX += ctx.measureText(part1).width;

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px Arial';
  startX += drawOrdinalInline(ctx, startX, yGiven, sDay);

  ctx.fillStyle = '#d6e6ff';
  ctx.font = '15px Arial';
  ctx.fillText(part2, startX, yGiven);
  
  ctx.textAlign = 'center';
  ctx.fillText('Lianga, Surigao del Sur', W / 2, yGiven + lineGap);

  // --- SIGNATURE SECTION ---
  const sigW = 80;
  const sigH = 45;
  const sigCanvas = document.createElement('canvas');
  const sigCtx = sigCanvas.getContext('2d');
  sigCanvas.width = sigW; sigCanvas.height = sigH;
  sigCtx.drawImage(logoSig, 0, 0, sigW, sigH);
  
  // Apply Professional Gold Tint
  sigCtx.globalCompositeOperation = 'source-atop';
  sigCtx.fillStyle = '#C9A84C'; 
  sigCtx.fillRect(0, 0, sigW, sigH);

  ctx.globalCompositeOperation = 'lighten';
  ctx.drawImage(sigCanvas, (W / 2) - (sigW / 2), 610, sigW, sigH);
  ctx.globalCompositeOperation = 'source-over';

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px Arial';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 675);
  ctx.fillStyle = '#d6e6ff';
  ctx.font = '13px Arial';
  ctx.fillText('BSCS Program Coordinator', W / 2, 695);

  // Export to PDF
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
