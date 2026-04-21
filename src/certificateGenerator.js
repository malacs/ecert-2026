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
  3: { day: 22, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
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

  // Load Assets
  const [bg, logoNemsu, logoCite, logoSig] = await Promise.all([
    loadImage('/cert-bg.png'),
    loadImage('/logo-nemsu.png'),
    loadImage('/logo-cite.png'),
    loadImage('/logo-signature.png'),
  ]);

  // Render Background
  ctx.drawImage(bg, 0, 0, W, H);
  ctx.fillStyle = 'rgba(10, 20, 60, 0.25)';
  ctx.fillRect(0, 0, W, H);

  // Date Logic
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

  // LOGO PLACEMENT (NEMSU & CITE)
  const logoSize = 90;
  const logoY = 115;
  const logoSpacing = 255;

  // Left Logo
  ctx.drawImage(logoNemsu, (W / 2) - logoSpacing - logoSize / 2, logoY - logoSize / 2, logoSize, logoSize);

  // Right Logo (Aspect Ratio Fix)
  const citeX = (W / 2) + logoSpacing;
  const aspect = logoCite.width / logoCite.height;
  const citeScale = 1.8; 
  let drawW = (aspect > 1) ? (logoSize * citeScale) : (logoSize * citeScale) * aspect;
  let drawH = (aspect > 1) ? (logoSize * citeScale) / aspect : (logoSize * citeScale);
  ctx.drawImage(logoCite, citeX - drawW / 2, logoY - drawH / 2, drawW, drawH);

  // HEADER TEXT
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

  // TITLE
  const titleText = role === 'Speaker' ? 'CERTIFICATE OF RECOGNITION' : 'CERTIFICATE OF PARTICIPATION';
  ctx.font = 'bold 46px Calibri, Arial';
  ctx.fillText(titleText, W / 2, 250);

  ctx.fillStyle = '#d6e6ff';
  ctx.font = '14px Arial';
  ctx.fillText('This certificate is hereby presented to', W / 2, 270);

  // PARTICIPANT NAME
  ctx.fillStyle = '#ffffff';
  const nameDisplay = participantName.toUpperCase();
  const nameFontSize = fitTextToWidth(ctx, nameDisplay, W - 240, 52, 'Calibri, Arial');
  ctx.font = `bold ${nameFontSize}px Calibri, Arial`;
  ctx.fillText(nameDisplay, W / 2, 365);

  // MAIN BODY TEXT
  ctx.fillStyle = '#d6e6ff';
  ctx.font = '14px Arial';
  const lineH = 22;
  const actionText = role === 'Speaker' 
    ? 'for sharing their invaluable expertise as the Resource Speaker during the' 
    : 'for actively participating in the';

  ctx.fillText(`${actionText} DATA INSIGHTS 2026:`, W / 2, 410);
  ctx.fillText('Virtual Training Series on Data Mining Concepts, Techniques, and Applications', W / 2, 410 + lineH);
  ctx.fillText(`held virtually via Google Meet on ${sMonth} ${sDay}, ${sYear} from ${sTime}.`, W / 2, 410 + (lineH * 2));

  // LOCATION & DATE LINE
  const yLine = 500;
  const lineA = 'Given this ';
  const lineB = ` of ${sMonth}, ${sYear} at NEMSU – Lianga Campus, Surigao del Sur.`;
  const lineAW = ctx.measureText(lineA).width;
  const lineBW = ctx.measureText(lineB).width;
  const totalLineW = lineAW + 35 + lineBW;
  let startX = (W / 2) - (totalLineW / 2);

  ctx.textAlign = 'left';
  ctx.fillText(lineA, startX, yLine);
  startX += lineAW;
  ctx.fillStyle = '#ffffff';
  startX += drawOrdinalInline(ctx, startX, yLine, sDay);
  ctx.fillStyle = '#d6e6ff';
  ctx.fillText(lineB, startX, yLine);

  // SIGNATURE AREA
  const sigW = 65;
  const sigH = 38;
  const sigCanvas = document.createElement('canvas');
  const sigCtx = sigCanvas.getContext('2d');
  sigCanvas.width = sigW;
  sigCanvas.height = sigH;
  sigCtx.drawImage(logoSig, 0, 0, sigW, sigH);
  sigCtx.globalCompositeOperation = 'source-atop';
  sigCtx.fillStyle = '#C9A84C'; // Gold finish signature
  sigCtx.fillRect(0, 0, sigW, sigH);

  ctx.globalCompositeOperation = 'lighten';
  ctx.drawImage(sigCanvas, W / 2 - sigW / 2, 618, sigW, sigH);
  ctx.globalCompositeOperation = 'source-over';

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Arial';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 660);
  ctx.fillStyle = '#d6e6ff';
  ctx.font = '13px Arial';
  ctx.fillText('BSCS Program Coordinator', W / 2, 680);

  // PDF Generation
  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [W, H],
  });
  pdf.addImage(imgData, 'PNG', 0, 0, W, H);

  return { pdf, imgData };
};

export const downloadCertificate = async (participantName, trainingDay = null, role = 'Student') => {
  const { pdf } = await generateCertificate(participantName, trainingDay, role);
  const safeName = participantName.replace(/\s+/g, '_');
  pdf.save(`Certificate_${safeName}.pdf`);
};

export const getCertificateDataUrl = async (participantName, trainingDay = null, role = 'Student') => {
  const { imgData } = await generateCertificate(participantName, trainingDay, role);
  return imgData;
};
