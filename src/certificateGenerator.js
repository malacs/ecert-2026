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
  ctx.drawImage(bg, 0, 0, W, H);

  const { day, month, year, time } = DAY_DATES[Number(trainingDay)] || DAY_DATES[1];

  // LOGOS (NEMSU on Left, CITE on Right)
  const logoSize = 80;
  ctx.drawImage(logoNemsu, 220, 80, logoSize, logoSize);
  ctx.drawImage(logoCite, 700, 80, logoSize, logoSize);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';

  // HEADER
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
  const titleText = role === 'Speaker' ? 'CERTIFICATE OF RECOGNITION' : 'CERTIFICATE OF PARTICIPATION';
  ctx.fillText(titleText, W / 2, 210);

  ctx.font = 'italic 15px Arial';
  ctx.fillText('This certificate is hereby presented to', W / 2, 245);

  // NAME
  ctx.font = 'bold 50px Arial';
  ctx.fillText(participantName.toUpperCase(), W / 2, 305);

  // FULL BODY CONTENT (Added missing words)
  ctx.font = '14px Arial';
  const lineSpacing = 20;
  const bodyY = 360;
  
  const bodyText = [
    `for ${role === 'Speaker' ? 'sharing expertise as a Speaker' : 'actively participating'} in the DATA INSIGHTS 2026:`,
    "Virtual Training Series on Data Mining Concepts, Techniques, and Applications",
    `held virtually via Google Meet on ${month} ${day}, ${year} from ${time},`,
    "in recognition of commitment to learning and professional development."
  ];

  bodyText.forEach((line, i) => {
    ctx.fillText(line, W / 2, bodyY + (i * lineSpacing));
  });

  // LOCATION & DATE
  ctx.font = 'bold 13px Arial';
  ctx.fillText(`Given this ${day}th day of ${month}, ${year} at NEMSU — Lianga Campus, Surigao del Sur.`, W / 2, 480);

  // SIGNATURE
  ctx.drawImage(logoSig, W / 2 - 60, 520, 120, 65);
  ctx.font = 'bold 15px Arial';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 610);
  ctx.font = '13px Arial';
  ctx.fillText('BSCS Program Coordinator', W / 2, 628);

  const imgData = canvas.toDataURL('image/jpeg', 0.9);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [W, H] });
  pdf.addImage(imgData, 'JPEG', 0, 0, W, H);

  return { pdf, imgData };
};

export const downloadCertificate = async (participantName, trainingDay, role) => {
  const { pdf } = await generateCertificate(participantName, trainingDay, role);
  pdf.save(`Certificate_${participantName.replace(/\s+/g, '_')}.pdf`);
};

export const getCertificateDataUrl = async (participantName, trainingDay, role) => {
  const { imgData } = await generateCertificate(participantName, trainingDay, role);
  return imgData;
};
