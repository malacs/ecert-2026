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

export const generateCertificate = async (participantName, addedDate = null) => {
  const canvas = document.createElement('canvas');
  const W = 1123;
  const H = 794;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Load all images
  const [bg, logoNemsu, logoCite, logoSig] = await Promise.all([
    loadImage('/cert-bg.png'),
    loadImage('/logo-nemsu.png'),
    loadImage('/logo-cite.png'),
    loadImage('/logo-signature.png'),
  ]);

  // Draw background
  ctx.drawImage(bg, 0, 0, W, H);

  // Date
  const dateObj = addedDate ? new Date(addedDate) : new Date();
  const day = dateObj.getDate();
  const monthNames = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  // --- LOGOS ---
  // NEMSU logo - left, bigger
  ctx.drawImage(logoNemsu, 60, 20, 100, 100);
  // CITE logo - right, bigger
  ctx.drawImage(logoCite, W - 160, 20, 100, 100);

  // --- HEADER TEXT ---
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';

  ctx.font = '500 14px Georgia, serif';
  ctx.fillText('Republic of the Philippines', W / 2, 45);

  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText('North Eastern Mindanao State University', W / 2, 65);

  ctx.font = '500 14px Georgia, serif';
  ctx.fillText('Lianga Campus', W / 2, 83);

  // Gold divider line
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 96);
  ctx.lineTo(W - 80, 96);
  ctx.stroke();

  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('College of Information Technology Education', W / 2, 114);
  ctx.fillText('Department of Computer Studies', W / 2, 132);

  // --- CERTIFICATE TITLE ---
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px Georgia, serif';
  ctx.fillText('CERTIFICATE OF PARTICIPATION', W / 2, 210);

  // --- PRESENTED TO ---
  ctx.fillStyle = '#d4e8ff';
  ctx.font = 'italic 17px Georgia, serif';
  ctx.fillText('This certificate is hereby presented to', W / 2, 255);

  // --- PARTICIPANT NAME ---
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 68px Georgia, serif';
  ctx.shadowColor = '#4a90d9';
  ctx.shadowBlur = 18;
  ctx.fillText(participantName.toUpperCase(), W / 2, 355);
  ctx.shadowBlur = 0;

  // --- BODY TEXT ---
  ctx.fillStyle = '#d4e8ff';
  ctx.font = '14px Georgia, serif';
  ctx.fillText(
    'for actively participating in the DATA INSIGHTS 2026: Virtual Training Series on Data Mining Concepts, Techniques,',
    W / 2, 400
  );
  ctx.fillText('and Applications', W / 2, 418);
  ctx.fillText(
    'held virtually via Google Meet on April 15, 17, 22, 24, 29 & May 1, 2026 from 8:00 AM to 12:00 PM, in recognition of commitment',
    W / 2, 444
  );
  ctx.fillText(
    'to learning and professional development through active engagement in the training sessions.',
    W / 2, 462
  );

  // --- GIVEN THIS LINE ---
  const normalFont = '14px Georgia, serif';
  const boldFont = 'bold 14px Georgia, serif';
  const gParts = [
    { text: 'Given this ', bold: false },
    { text: `${getOrdinal(day)} of ${month}, ${year}`, bold: true },
    { text: ' at ', bold: false },
    { text: 'North Eastern Mindanao State University \u2013 Lianga Campus,', bold: true },
  ];

  let totalWidth = 0;
  gParts.forEach(p => {
    ctx.font = p.bold ? boldFont : normalFont;
    totalWidth += ctx.measureText(p.text).width;
  });

  let x = W / 2 - totalWidth / 2;
  gParts.forEach(p => {
    ctx.font = p.bold ? boldFont : normalFont;
    ctx.fillStyle = '#d4e8ff';
    ctx.textAlign = 'left';
    ctx.fillText(p.text, x, 500);
    x += ctx.measureText(p.text).width;
  });

  ctx.font = normalFont;
  ctx.fillStyle = '#d4e8ff';
  ctx.textAlign = 'center';
  ctx.fillText('Lianga, Surigao del Sur', W / 2, 518);

  // --- SIGNATURE ---
  // Draw signature image above the line
  const sigW = 90;
  const sigH = 66;
  ctx.drawImage(logoSig, W / 2 - sigW / 2, 618, sigW, sigH);

  // Signature line
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 160, 690);
  ctx.lineTo(W / 2 + 160, 690);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 710);

  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = '#d4e8ff';
  ctx.fillText('BSCS Program Coordinator', W / 2, 728);

  // Export
  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [W, H] });
  pdf.addImage(imgData, 'PNG', 0, 0, W, H);
  return { pdf, imgData };
};

export const downloadCertificate = async (participantName, addedDate = null) => {
  const { pdf } = await generateCertificate(participantName, addedDate);
  pdf.save(`Certificate_${participantName.replace(/\s+/g, '_')}.pdf`);
};

export const getCertificateDataUrl = async (participantName, addedDate = null) => {
  const { imgData } = await generateCertificate(participantName, addedDate);
  return imgData;
};
