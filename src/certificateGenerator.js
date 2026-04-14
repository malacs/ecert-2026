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

// Official Schedule from University Letter
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

  // ── BACKGROUND & OPACITY ─────────────────────────
  ctx.drawImage(bg, 0, 0, W, H);
  
  // Instructor Feedback: Lessened opacity to 0.25
  ctx.fillStyle = 'rgba(10, 20, 60, 0.25)'; 
  ctx.fillRect(0, 0, W, H);

  // ── LOGIC: DATE CALCULATIONS ───────────────────
  // 1. Session Date (From Admin Panel selection)
  let sDay, sMonth, sYear;
  const selected = Number(trainingDay);
  if (selected && DAY_DATES[selected]) {
    sDay = DAY_DATES[selected].day;
    sMonth = DAY_DATES[selected].month;
    sYear = DAY_DATES[selected].year;
  } else {
    sDay = 15; sMonth = 'April'; sYear = 2026;
  }

  // 2. Given Date (Automatic Today's Date)
  const now = new Date();
  const gDayNum = now.getDate();
  const gMonth = now.toLocaleString('default', { month: 'long' });
  const gYear = now.getFullYear();

  ctx.textAlign = 'center';

  // ── HEADER SECTION ─────────────────────────
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

  ctx.font = 'bold 46px Calibri, Arial';
  ctx.fillText('CERTIFICATE OF PARTICIPATION', W / 2, 250);
  ctx.fillStyle = '#d6e6ff';
  ctx.font = '14px Arial';
  ctx.fillText('This certificate is hereby presented to', W / 2, 270);

  ctx.fillStyle = '#ffffff'; // White name text
  ctx.font = '52px "Lucida Calligraphy", cursive';
  ctx.fillText(participantName.toUpperCase(), W / 2, 365);

  // ── FULL BODY TEXT (Single Date) ─────────────────────────
  ctx.fillStyle = '#d6e6ff';
  ctx.font = '14px Arial';
  const lineGap = 22;
  
  // Title
  ctx.fillText('for actively participating in the DATA INSIGHTS 2026: Virtual Training Series on Data Mining Concepts, Techniques, and Applications', W / 2, 410);
  
  // Session date
  ctx.fillText(`held virtually via Google Meet on ${sMonth} ${sDay}, ${sYear} from 8:00 AM to 12:00 PM, in recognition of commitment`, W / 2, 410 + lineGap);
  
  // Closing phrase
  ctx.fillText('to learning and professional development through active engagement in the training sessions.', W / 2, 410 + (lineGap * 2));

  // ── GIVEN DATE (Auto-Date) ─────────────────────────
  ctx.textAlign = 'center'; 
  const y = 500;
  ctx.fillStyle = '#d6e6ff';
  ctx.fillText('Given this ', W / 2, y);

  // Special Ordinal Drawing logic (keeps '14th' correctly positioned while centered)
  const part1 = 'Given this ';
  const part2 = ` of ${gMonth}, ${gYear} at North Eastern Mindanao State University – Lianga Campus,`;
  const totalWidth = ctx.measureText(part1).width + 30 + ctx.measureText(part2).width;
  let startX = (W / 2) - (totalWidth / 2);

  ctx.textAlign = 'left';
  ctx.fillText(part1, startX, y);
  startX += ctx.measureText(part1).width;
  ctx.fillStyle = '#ffffff';
  startX += drawOrdinalInline(ctx, startX, y, gDayNum); 
  ctx.fillStyle = '#d6e6ff';
  ctx.fillText(part2, startX, y);

  ctx.textAlign = 'center';
  ctx.fillText('Lianga, Surigao del Sur', W / 2, y + lineGap);

  // ── SIGNATURE ─────────────────────────
  // Final Modification: Making the signature lighter
  ctx.globalAlpha = 0.5; // Set to 50% opacity for a softer look (Default is 1.0)
  ctx.drawImage(logoSig, W / 2 - 32, 618, 65, 38);
  ctx.globalAlpha = 1.0; // Reset back to full opacity for subsequent drawing

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Arial';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 660);
  ctx.fillStyle = '#d6e6ff';
  ctx.fillText('BSCS Program Coordinator', W / 2, 680);

  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [W, H] });
  pdf.addImage(imgData, 'PNG', 0, 0, W, H);
  return { pdf, imgData };
};
