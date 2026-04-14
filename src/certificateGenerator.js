
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
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
};

export const generateCertificate = async (participantName, addedDate = null) => {
  const canvas = document.createElement('canvas');
  const W = 1123;
  const H = 794;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const bg = await loadImage('/cert-bg.png');
  const logoCite = await loadImage('/logo-cite.png');
  const logoNemsu = await loadImage('/logo-nemsu.png');

  ctx.drawImage(bg, 0, 0, W, H);

  const dateObj = addedDate ? new Date(addedDate) : new Date();
  const day = dateObj.getDate();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  ctx.drawImage(logoNemsu, 80, 28, 90, 90);
  ctx.drawImage(logoCite, W - 175, 28, 90, 90);

  ctx.fillStyle = '#ffffff';
  ctx.font = '500 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Republic of the Philippines', W / 2, 52);
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText('North Eastern Mindanao State University', W / 2, 74);
  ctx.font = '500 15px Georgia, serif';
  ctx.fillText('Lianga Campus', W / 2, 94);

  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 108);
  ctx.lineTo(W - 80, 108);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('College of Information Technology Education', W / 2, 130);
  ctx.fillText('Department of Computer Studies', W / 2, 150);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('CERTIFICATE OF PARTICIPATION', W / 2, 225);

  ctx.fillStyle = '#d4e8ff';
  ctx.font = 'italic 18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('This certificate is hereby presented to', W / 2, 268);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#4a90d9';
  ctx.shadowBlur = 18;
  ctx.fillText(participantName.toUpperCase(), W / 2, 370);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#d4e8ff';
  ctx.font = '15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('for actively participating in the DATA INSIGHTS 2026: Virtual Training Series on Data Mining Concepts, Techniques,', W / 2, 415);
  ctx.fillText('and Applications', W / 2, 435);
  ctx.fillText('held virtually via Google Meet on April 15, 17, 22, 24, 29 & May 1, 2026 from 8:00 AM to 12:00 PM, in recognition of commitment', W / 2, 462);
  ctx.fillText('to learning and professional development through active engagement in the training sessions.', W / 2, 482);

  const normalFont = '15px Georgia, serif';
  const boldFont = 'bold 15px Georgia, serif';
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
    ctx.fillText(p.text, x, 522);
    x += ctx.measureText(p.text).width;
  });

  ctx.font = normalFont;
  ctx.fillStyle = '#d4e8ff';
  ctx.textAlign = 'center';
  ctx.fillText('Lianga, Surigao del Sur', W / 2, 542);

  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 160, 700);
  ctx.lineTo(W / 2 + 160, 700);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 720);
  ctx.font = '14px Georgia, serif';
  ctx.fillStyle = '#d4e8ff';
  ctx.fillText('BSCS Program Coordinator', W / 2, 738);

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
