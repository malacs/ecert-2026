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

// Official Schedule for the Training Series
const DAY_DATES = {
  1: { day: 15, month: 'April', year: 2026 },
  2: { day: 17, month: 'April', year: 2026 },
  3: { day: 22, month: 'April', year: 2026 },
  4: { day: 24, month: 'April', year: 2026 },
  5: { day: 29, month: 'April', year: 2026 },
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

  // ── BACKGROUND ─────────────────────────
  ctx.drawImage(bg, 0, 0, W, H);
  
  // Instructor Feedback: Opacity at 0.25 (lighter)
  ctx.fillStyle = 'rgba(10, 20, 60, 0.25)'; 
  ctx.fillRect(0, 0, W, H);

  // ── LOGIC: SESSION DATE (From Admin Selection) ────────────────
  let sessionDay, sessionMonth, sessionYear;
  const selectedDay = Number(trainingDay);
  if (selectedDay && DAY_DATES[selectedDay]) {
    const d = DAY_DATES[selectedDay];
    sessionDay = d.day;
    sessionMonth = d.month;
    sessionYear = d.year;
  } else {
    sessionDay = 15;
    sessionMonth = 'April';
    sessionYear = 2026;
  }

  // ── LOGIC: GIVEN DATE (Automatic Today's Date) ────────────────
  const now = new Date();
  const givenDayNum = now.getDate();
  const givenMonthName = now.toLocaleString('default', { month: 'long' });
  const givenYearNum = now.getFullYear();

  ctx.textAlign = 'center';

  // ── HEADER & LOGOS ─────────────────────────
  const baseHeight = 65;
  const nemsuWidth = (logoNemsu.width / logoNemsu.height) * baseHeight;
  const centerX = W / 2;
  ctx.drawImage(logoNemsu, centerX - 210 - nemsuWidth / 2, 135 - baseHeight, nemsuWidth, baseHeight);
  
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

  // ── TITLE & NAME ─────────────────────────
  ctx.font = 'bold 46px Calibri, Arial';
  ctx.fillText('CERTIFICATE OF PARTICIPATION', W / 2, 250);
  ctx.fillStyle = '#d6e6ff';
  ctx.font = '14px Arial';
  ctx.fillText('This certificate is hereby presented to', W / 2, 270);

  ctx.fillStyle = '#ffffff'; // White for name (or change to #C9A84C for Gold)
  ctx.font = '52px "Lucida Calligraphy", cursive';
  ctx.fillText(participantName.toUpperCase(), W / 2, 365);

  // ── BODY TEXT (Specific Session Date) ─────────────────────────
  ctx.fillStyle = '#d6e6ff';
  ctx.font = '14px Arial';
  const lineGap = 22;
  ctx.fillText('for actively participating in the DATA INSIGHTS 2026: Virtual Training Series', W / 2, 410);
  ctx.fillText(`held virtually via Google Meet on ${sessionMonth} ${sessionDay}, ${sessionYear} from 8:00 AM to 12:00 PM,`, W / 2, 410 + lineGap);
  ctx.fillText('in recognition of commitment to learning and professional development.', W / 2, 410 + lineGap * 2);

  // ── GIVEN DATE SECTION (The Automatic Part) ─────────────────────────
  ctx.font = '14px Arial';
  ctx.textAlign = 'left';
  const yPos = 410 + lineGap * 4;
  let xPos = W / 2 - 300;
  
  ctx.fillStyle = '#d6e6ff';
  ctx.fillText('Given this ', xPos, yPos);
  xPos += ctx.measureText('Given this ').width;
  
  ctx.fillStyle = '#ffffff';
  xPos += drawOrdinalInline(ctx, xPos, yPos, givenDayNum); 
  
  ctx.fillStyle = '#d6e6ff';
  const givenSuffix = ` of ${givenMonthName}, ${givenYearNum} at `;
  ctx.fillText(givenSuffix, xPos, yPos);
  xPos += ctx.measureText(givenSuffix).width;
  
  ctx.fillStyle = '#ffffff';
  ctx.fillText('NEMSU – Lianga Campus, Lianga, Surigao del Sur', xPos, yPos);

  // ── SIGNATURE ─────────────────────────
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(logoSig, W / 2 - 32, 618, 65, 38);
  ctx.globalCompositeOperation = 'source-over';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Arial';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 660);
  ctx.fillStyle = '#d6e6ff';
  ctx.fillText('BSCS Program Coordinator', W / 2, 680);

  // ── PDF EXPORT ─────────────────────────
  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [W, H] });
  pdf.addImage(imgData, 'PNG', 0, 0, W, H);
  return { pdf, imgData };
};

export const downloadCertificate = async (name, day) => {
  const { pdf } = await generateCertificate(name, day);
  pdf.save(`Certificate_${name.replace(/\s+/g, '_')}.pdf`);
};

export const getCertificateDataUrl = async (name, day) => {
  const { imgData } = await generateCertificate(name, day);
  return imgData;
};
