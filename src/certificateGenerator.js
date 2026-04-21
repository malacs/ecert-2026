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

const fitTextToWidth = (ctx, text, maxWidth, initialSize, fontFamily) => {
  let fontSize = initialSize;
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  while (ctx.measureText(text).width > maxWidth && fontSize > 20) {
    fontSize--;
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
  }
  return fontSize;
};

const DAY_DATES = {
  1: { day: 15, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  2: { day: 17, month: 'April', year: 2026, time: '8:30 AM to 12:00 PM' },
  3: { day: 22, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' }, // Tomorrow's Session
  4: { day: 24, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  5: { day: 29, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
};

export const generateCertificate = async (participantName, trainingDay = null, role = 'Student') => {
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

  ctx.drawImage(bg, 0, 0, W, H);
  ctx.fillStyle = 'rgba(10, 20, 60, 0.25)';
  ctx.fillRect(0, 0, W, H);

  let sDay, sMonth, sYear, sTime;
  const selected = Number(trainingDay);
  if (selected && DAY_DATES[selected]) {
    sDay = DAY_DATES[selected].day;
    sMonth = DAY_DATES[selected].month;
    sYear = DAY_DATES[selected].year;
    sTime = DAY_DATES[selected].time;
  } else {
    sDay = 15; sMonth = 'April'; sYear = 2026; sTime = '8:00 AM to 12:00 PM';
  }

  // Logos
  const logoSize = 90;
  const logoY = 115;
  const logoSpacing = 255;
  ctx.drawImage(logoNemsu, (W / 2) - logoSpacing - logoSize / 2, logoY - logoSize / 2, logoSize, logoSize);
  
  const citeX = (W / 2) + logoSpacing;
  const aspect = logoCite.width / logoCite.height;
  const citeScale = 1.8; 
  let drawW = (aspect > 1) ? (logoSize * citeScale) : (logoSize * citeScale) * aspect;
  let drawH = (aspect > 1) ? (logoSize * citeScale) / aspect : (logoSize * citeScale);
  ctx.drawImage(logoCite, citeX - drawW / 2, logoY - drawH / 2, drawW, drawH);

  // Text setup
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '13px Arial';
  ctx.fillText('Republic of the Philippines', W / 2, 85);
  ctx.font = 'bold 16px Arial';
  ctx.fillText('North Eastern Mindanao State University', W / 2, 110);
  ctx.font = '13px Arial';
  ctx.fillText('Lianga Campus', W / 2, 135);
  ctx.font = 'bold 13px Arial';
  ctx.fillText('College of Information Technology Education', W / 2, 165);
  ctx.fillText('Department of Computer Studies', W / 2, 185);

  // Title changes based on role
  const titleText = role === 'Speaker' ? 'CERTIFICATE OF RECOGNITION' : 'CERTIFICATE OF PARTICIPATION';
  ctx.font = 'bold 46px Calibri, Arial';
  ctx.fillText(titleText, W / 2, 250);

  ctx.fillStyle = '#d6e6ff';
  ctx.font = '14px Arial';
  ctx.fillText('This certificate is hereby presented to', W / 2, 270);

  // Name
  ctx.fillStyle = '#ffffff';
  const nameDisplay = participantName.toUpperCase();
  const nameFontSize = fitTextToWidth(ctx, nameDisplay, W - 240, 52, 'Calibri, Arial');
  ctx.font = `bold ${nameFontSize}px Calibri, Arial`;
  ctx.fillText(nameDisplay, W / 2, 365);

  // BODY TEXT - RESTORED FULL VERSION
  ctx.fillStyle = '#d6e6ff';
  ctx.font = '14px Arial';
  const lineGap = 22;

  // Role-based wording for the first line
  const introText = role === 'Speaker' 
    ? 'for sharing their invaluable expertise as the Resource Speaker during the' 
    : 'for actively participating in the';

  ctx.fillText(`${introText} DATA INSIGHTS 2026: Virtual Training Series on Data Mining Concepts, Techniques, and Applications`, W / 2, 410);

  ctx.fillText(
    `held virtually via Google Meet on ${sMonth} ${sDay}, ${sYear} from ${sTime}, in recognition of commitment`,
    W / 2,
    410 + lineGap
  );

  ctx.fillText(
    'to learning and professional development through active engagement in the training sessions.',
    W / 2,
    410 + lineGap * 2
  );

  // Date line
  const yGiven = 500;
  const part1 = 'Given this ';
  const part2 = ` of ${sMonth}, ${sYear} at North Eastern Mindanao State University – Lianga Campus,`;
  const totalW = ctx.measureText(part1).width + 30 + ctx.measureText(part2).width;
  let startX = (W / 2) - (totalW / 2);

  ctx.textAlign = 'left';
  ctx.fillText(part1, startX, yGiven);
  startX += ctx.measureText(part1).width;
  ctx.fillStyle = '#ffffff';
  startX += drawOrdinalInline(ctx, startX, yGiven, sDay);
  ctx.fillStyle = '#d6e6ff';
  ctx.fillText(part2, startX, yGiven);

  ctx.textAlign = 'center';
  ctx.fillText('Lianga, Surigao del Sur', W / 2, yGiven + lineGap);

  // Signature
  const sigW = 65;
  const sigH = 38;
  const sigCanvas = document.createElement('canvas');
  const sigCtx = sigCanvas.getContext('2d');
  sigCanvas.width = sigW; sigCanvas.height = sigH;
  sigCtx.drawImage(logoSig, 0, 0, sigW, sigH);
  sigCtx.globalCompositeOperation = 'source-atop';
  sigCtx.fillStyle = '#C9A84C';
  sigCtx.fillRect(0, 0, sigW, sigH);

  ctx.globalCompositeOperation = 'lighten';
  ctx.drawImage(sigCanvas, W / 2 - sigW / 2, 618, sigW, sigH);
  ctx.globalCompositeOperation = 'source-over';

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Arial';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 660);
  ctx.fillStyle = '#d6e6ff';
  ctx.font = '13px Arial';
  ctx.fillText('BSCS Program Coordinator', W / 2, 680);

  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [W, H] });
  pdf.addImage(imgData, 'PNG', 0, 0, W, H);
  return { pdf, imgData };
};

export const downloadCertificate = async (participantName, trainingDay = null, role = 'Student') => {
  const { pdf } = await generateCertificate(participantName, trainingDay, role);
  pdf.save(`Certificate_${participantName.replace(/\s+/g, '_')}.pdf`);
};

export const getCertificateDataUrl = async (participantName, trainingDay = null, role = 'Student') => {
  const { imgData } = await generateCertificate(participantName, trainingDay, role);
  return imgData;
};
