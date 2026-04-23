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
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const DAY_DATES = {
  1: { day: 15, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  2: { day: 17, month: 'April', year: 2026, time: '8:30 AM to 12:00 PM' },
  3: { day: 22, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  4: { day: 24, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
  5: { day: 29, month: 'April', year: 2026, time: '8:00 AM to 12:00 PM' },
};

const getGoldSignature = (image) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = '#c9a84c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
};

export const generateCertificate = async (participantName, trainingDay = null, role = 'Student') => {
  const W = 1000;
  const H = 700;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const [bg, logoNemsu, logoCite, logoSig] = await Promise.all([
    loadImage('/cert-bg.png'),
    loadImage('/logo-nemsu.png'),
    loadImage('/logo-cite.png'),
    loadImage('/logo-signature.png'),
  ]);

  ctx.clearRect(0, 0, W, H);

  // BACKGROUND
  ctx.drawImage(bg, 0, 0, W, H);
  ctx.fillStyle = 'rgba(10, 20, 60, 0.15)';
  ctx.fillRect(0, 0, W, H);

  const data = DAY_DATES[Number(trainingDay)] || DAY_DATES[1];

  // 1. LOGOS
  const logoSize = 100;
  const logoY = 60;
  const spacing = 260;

  const drawLogoFixed = (img, centerX) => {
    const aspect = img.width / img.height;
    let dW = logoSize, dH = logoSize;
    if (aspect > 1) dH = logoSize / aspect;
    else dW = logoSize * aspect;
    ctx.drawImage(img, centerX - dW / 2, logoY + (logoSize - dH) / 2, dW, dH);
  };

  const drawLogoSquare = (img, centerX) => {
    ctx.drawImage(img, centerX - logoSize / 2, logoY, logoSize, logoSize);
  };

  drawLogoFixed(logoNemsu, (W / 2) - spacing);
  drawLogoSquare(logoCite, (W / 2) + spacing);

  // 2. HEADER TEXT
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '13px Arial';
  ctx.fillText('Republic of the Philippines', W / 2, 60);
  ctx.font = 'bold 17px Arial';
  ctx.fillText('North Eastern Mindanao State University', W / 2, 85);
  ctx.font = '13px Arial';
  ctx.fillText('Lianga Campus', W / 2, 105);
  ctx.font = 'bold 14px Arial';
  ctx.fillText('College of Information Technology Education', W / 2, 135);
  ctx.font = '13px Arial';
  ctx.fillText('Department of Computer Studies', W / 2, 155);

  // 3. TITLE
  ctx.font = 'bold 38px Arial';
  const title = role === 'Speaker' ? 'CERTIFICATE OF RECOGNITION' : 'CERTIFICATE OF PARTICIPATION';
  ctx.fillText(title, W / 2, 220);

  ctx.font = 'italic 16px Georgia';
  ctx.fillText('This certificate is hereby presented to', W / 2, 255);

  // 4. NAME
  ctx.font = 'bold 48px Arial';
  ctx.fillText(participantName.toUpperCase(), W / 2, 315);

  // 5. BODY
  ctx.font = '14px Arial';
  const bodyY = 360;
  const lineGap = 22;
  ctx.fillText('for actively participating in the DATA INSIGHTS 2026: Virtual Training Series on Data Mining Concepts, Techniques, and Applications', W / 2, bodyY);
  ctx.fillText(`held virtually via Google Meet on ${data.month} ${getOrdinal(data.day)}, ${data.year} from ${data.time}, in recognition of commitment`, W / 2, bodyY + lineGap);
  ctx.fillText('to learning and professional development through active engagement in the training sessions.', W / 2, bodyY + (lineGap * 2));

  // 6. FOOTER
  ctx.font = '14px Arial';
  const footerY = 465;
  ctx.fillText(`Given this ${getOrdinal(data.day)} of ${data.month}, ${data.year} at North Eastern Mindanao State University — Lianga Campus,`, W / 2, footerY);
  ctx.fillText('Lianga, Surigao del Sur.', W / 2, footerY + 20);

  // 7. SIGNATURE
  const goldSigCanvas = getGoldSignature(logoSig);
  const sigW = 100;
  const sigH = 55;
  ctx.drawImage(goldSigCanvas, (W / 2) - (sigW / 2), 525, sigW, sigH);

  ctx.font = 'bold 16px Arial';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 605);
  ctx.font = '13px Arial';
  ctx.fillText('BSCS Program Coordinator', W / 2, 625);

  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [W, H], compress: true });
  pdf.addImage(imgData, 'PNG', 0, 0, W, H);
  return { pdf, imgData };
};

export const downloadCertificate = async (name, day, role) => {
  const { pdf } = await generateCertificate(name, day, role);
  const cleanName = name.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  pdf.save(`Certificate_${cleanName}.pdf`);
};

export const getCertificateDataUrl = async (name, day, role) => {
  const { imgData } = await generateCertificate(name, day, role);
  return imgData;
};
