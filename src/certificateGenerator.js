import jsPDF from 'jspdf';

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

const getOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const DAY_DATES = {
  1: { day: 15, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  2: { day: 17, month: 'April', year: 2026, time: '8:30 AM to 12:00 PM' },
  3: { day: 22, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  4: { day: 24, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  5: { day: 29, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
};

export const generateCertificate = async (participantName, trainingDay, role) => {
  const W = 1000;
  const H = 700;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const [bg, logoNemsu, logoCite] = await Promise.all([
    loadImage('/cert-bg.png'),
    loadImage('/logo-nemsu.png'),
    loadImage('/logo-cite.png'),
  ]);

  // BACKGROUND
  ctx.drawImage(bg, 0, 0, W, H);

  const data = DAY_DATES[Number(trainingDay)] || DAY_DATES[1];

  // =========================
  // 🔧 FIXED HEADER POSITION
  // =========================
  const headerStartY = 80; // moved DOWN from 60 → 80
  const lineGap = 22;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';

  ctx.font = '13px Arial';
  ctx.fillText('Republic of the Philippines', W / 2, headerStartY);

  ctx.font = 'bold 17px Arial';
  ctx.fillText('North Eastern Mindanao State University', W / 2, headerStartY + lineGap);

  ctx.font = '13px Arial';
  ctx.fillText('Lianga Campus', W / 2, headerStartY + (lineGap * 2));

  ctx.font = 'bold 14px Arial';
  ctx.fillText('College of Information Technology Education', W / 2, headerStartY + (lineGap * 3));

  ctx.font = '13px Arial';
  ctx.fillText('Department of Computer Studies', W / 2, headerStartY + (lineGap * 4));

  // =========================
  // 🔧 FIXED LOGO ALIGNMENT
  // =========================
  const logoSize = 110;
  const spacing = 260;

  // Align logos to "Lianga Campus" baseline
  const liangaY = headerStartY + (lineGap * 2);

  const drawLogoCircle = (img, centerX) => {
    const y = liangaY - logoSize + 10; // aligns bottom of logo to text line

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, y + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, centerX - logoSize / 2, y, logoSize, logoSize);
    ctx.restore();
  };

  drawLogoCircle(logoNemsu, (W / 2) - spacing);
  drawLogoCircle(logoCite, (W / 2) + spacing);

  // =========================
  // TITLE
  // =========================
  ctx.font = 'bold 38px Arial';
  const title = role === 'Speaker'
    ? 'CERTIFICATE OF RECOGNITION'
    : 'CERTIFICATE OF PARTICIPATION';
  ctx.fillText(title, W / 2, 240);

  ctx.font = 'italic 16px Georgia';
  ctx.fillText('This certificate is hereby presented to', W / 2, 275);

  // NAME
  ctx.font = 'bold 48px Arial';
  ctx.fillText(participantName.toUpperCase(), W / 2, 335);

  // BODY
  ctx.font = '14px Arial';
  const bodyY = 380;

  ctx.fillText(
    'for actively participating in the DATA INSIGHTS 2026: Virtual Training Series on Data Mining Concepts, Techniques, and Applications',
    W / 2,
    bodyY
  );

  ctx.fillText(
    `held virtually via Google Meet on ${data.month} ${getOrdinal(data.day)}, ${data.year} from ${data.time}, in recognition of commitment`,
    W / 2,
    bodyY + 22
  );

  ctx.fillText(
    'to learning and professional development through active engagement in the training sessions.',
    W / 2,
    bodyY + 44
  );

  // FOOTER
  ctx.font = '14px Arial';
  const footerY = 480;

  ctx.fillText(
    `Given this ${getOrdinal(data.day)} of ${data.month}, ${data.year} at North Eastern Mindanao State University — Lianga Campus,`,
    W / 2,
    footerY
  );

  ctx.fillText('Lianga, Surigao del Sur.', W / 2, footerY + 20);

  // SIGNATURE
  ctx.font = 'bold 16px Arial';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 610);

  ctx.font = '13px Arial';
  ctx.fillText('BSCS Program Coordinator', W / 2, 630);

  // EXPORT
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [W, H],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, W, H);

  return { pdf, imgData };
};

export const downloadCertificate = async (name, day, role) => {
  const { pdf } = await generateCertificate(name, day, role);
  const cleanName = name.trim().replace(/\s+/g, '_');
  pdf.save(`Certificate_${cleanName}.pdf`);
};

export const getCertificateDataUrl = async (name, day, role) => {
  const { imgData } = await generateCertificate(name, day, role);
  return imgData;
};
