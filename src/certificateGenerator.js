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

  // Draw Background
  ctx.drawImage(bg, 0, 0, W, H);
  const { day, month, year, time } = DAY_DATES[Number(trainingDay)] || DAY_DATES[1];

  // Logos - Positioned to fit the header
  ctx.drawImage(logoNemsu, 380, 75, 70, 70);
  ctx.drawImage(logoCite, 550, 75, 70, 70);

  // --- HEADER SECTION ---
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  
  ctx.font = '12px Arial';
  ctx.fillText('Republic of the Philippines', W / 2, 55);

  ctx.font = 'bold 16px Arial';
  ctx.fillText('North Eastern Mindanao State University', W / 2, 75);

  ctx.font = '12px Arial';
  ctx.fillText('Lianga Campus', W / 2, 90);

  ctx.font = 'bold 12px Arial';
  ctx.fillText('College of Information Technology Education', W / 2, 115);
  ctx.fillText('Department of Computer Studies', W / 2, 132);

  // --- TITLE SECTION ---
  ctx.font = 'bold 38px Arial';
  const title = role === 'Speaker' ? 'CERTIFICATE OF RECOGNITION' : 'CERTIFICATE OF PARTICIPATION';
  ctx.fillText(title, W / 2, 210);

  ctx.font = 'italic 16px Arial';
  ctx.fillText('This certificate is hereby presented to', W / 2, 245);

  // --- NAME SECTION ---
  ctx.font = 'bold 52px serif'; // Using serif to match the professional look in image_6197a9
  ctx.fillText(participantName.toUpperCase(), W / 2, 315);

  // --- BODY SECTION (Multi-line text from your image) ---
  ctx.font = '13px Arial';
  const line1 = "for actively participating in the DATA INSIGHTS 2026: Virtual Training Series on Data Mining";
  const line2 = "Concepts, Techniques, and Applications held virtually via Google Meet on";
  const line3 = `${month} ${day}, ${year} from ${time}, in recognition of commitment to learning`;
  const line4 = "and professional development through active engagement in the training sessions.";

  ctx.fillText(line1, W / 2, 370);
  ctx.fillText(line2, W / 2, 388);
  ctx.fillText(line3, W / 2, 406);
  ctx.fillText(line4, W / 2, 424);

  // --- LOCATION/DATE SECTION ---
  ctx.font = '13px Arial';
  ctx.fillText(`Given this ${day}th of ${month}, ${year} at North Eastern Mindanao State University — Lianga Campus,`, W / 2, 465);
  ctx.fillText(`Lianga, Surigao del Sur.`, W / 2, 482);

  // --- SIGNATURE SECTION ---
  ctx.drawImage(logoSig, W / 2 - 55, 525, 110, 65);
  
  ctx.font = 'bold 15px Arial';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 615);
  ctx.font = '13px Arial';
  ctx.fillText('BSCS Program Coordinator', W / 2, 635);

  // Final Output
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
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
