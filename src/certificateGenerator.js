import jsPDF from 'jspdf';

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

const DAY_DATES = {
  1: { day: 15, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  2: { day: 17, month: 'April', year: 2026, time: '8:30 AM to 12:00 PM' },
  3: { day: 22, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  4: { day: 24, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  5: { day: 29, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
};

export const generateCertificate = async (participantName, trainingDay = null, role = 'Student') => {
  // ✅ Slightly reduced but SAME LOOK
  const W = 1000;
  const H = 700;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');

  // ✅ WAIT for ALL images before drawing
  const [bg, logoNemsu, logoCite, logoSig] = await Promise.all([
    loadImage('/cert-bg.png'),
    loadImage('/logo-nemsu.png'),
    loadImage('/logo-cite.png'),
    loadImage('/logo-signature.png'),
  ]);

  // ✅ CLEAR canvas (fix ghost render bug)
  ctx.clearRect(0, 0, W, H);

  // BACKGROUND
  ctx.drawImage(bg, 0, 0, W, H);

  ctx.fillStyle = 'rgba(10, 20, 60, 0.15)';
  ctx.fillRect(0, 0, W, H);

  const { day, month, year, time } =
    DAY_DATES[Number(trainingDay)] || DAY_DATES[1];

  // LOGOS
  const logoSize = 80;
  const logoY = 100;
  const spacing = 220;

  ctx.drawImage(logoNemsu, (W / 2) - spacing, logoY, logoSize, logoSize);
  ctx.drawImage(logoCite, (W / 2) + spacing - logoSize, logoY, logoSize, logoSize);

  // TEXT (IMPORTANT: reset styles BEFORE drawing)
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';

  ctx.font = '13px Arial';
  ctx.fillText('Republic of the Philippines', W / 2, 60);

  ctx.font = 'bold 16px Arial';
  ctx.fillText('North Eastern Mindanao State University', W / 2, 85);

  ctx.font = '13px Arial';
  ctx.fillText('Lianga Campus', W / 2, 105);

  ctx.font = 'bold 13px Arial';
  ctx.fillText('College of Information Technology Education', W / 2, 130);
  ctx.fillText('Department of Computer Studies', W / 2, 150);

  // TITLE
  ctx.font = 'bold 40px Arial';
  ctx.fillText(
    role === 'Speaker'
      ? 'CERTIFICATE OF RECOGNITION'
      : 'CERTIFICATE OF PARTICIPATION',
    W / 2,
    210
  );

  ctx.font = '14px Arial';
  ctx.fillText('This certificate is hereby presented to', W / 2, 240);

  // NAME
  ctx.font = 'bold 42px Arial';
  ctx.fillText(participantName.toUpperCase(), W / 2, 300);

  // BODY
  ctx.font = '14px Arial';
  ctx.fillText(
    `Held on ${month} ${day}, ${year} from ${time}`,
    W / 2,
    350
  );

  // SIGNATURE (FIXED: remove blending bug)
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(logoSig, W / 2 - 50, 500, 100, 60);

  ctx.font = 'bold 13px Arial';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 580);

  ctx.font = '13px Arial';
  ctx.fillText('BSCS Program Coordinator', W / 2, 600);

  // ✅ SAFE IMAGE OUTPUT (fix invisible canvas on mobile)
  const imgData = canvas.toDataURL('image/jpeg', 0.85);

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [W, H],
  });

  pdf.addImage(imgData, 'JPEG', 0, 0, W, H);

  return { pdf, imgData };
};

export const downloadCertificate = async (participantName, trainingDay, role) => {
  const { pdf } = await generateCertificate(participantName, trainingDay, role);
  pdf.save(`Certificate_${participantName}.pdf`);
};

export const getCertificateDataUrl = async (participantName, trainingDay, role) => {
  const { imgData } = await generateCertificate(participantName, trainingDay, role);
  return imgData;
};
