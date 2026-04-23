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

  ctx.drawImage(bg, 0, 0, W, H);
  const { day, month, year, time } = DAY_DATES[Number(trainingDay)] || DAY_DATES[1];

  ctx.drawImage(logoNemsu, 385, 75, 65, 65);
  ctx.drawImage(logoCite, 550, 75, 65, 65);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF';
  
  ctx.font = '11px Arial';
  ctx.fillText('Republic of the Philippines', W / 2, 55);

  ctx.font = 'bold 15px Arial';
  ctx.fillText('North Eastern Mindanao State University', W / 2, 75);

  ctx.font = '11px Arial';
  ctx.fillText('Lianga Campus', W / 2, 90);

  ctx.font = 'bold 11px Arial';
  ctx.fillText('College of Information Technology Education', W / 2, 115);
  ctx.fillText('Department of Computer Studies', W / 2, 130);

  ctx.font = 'bold 36px Arial';
  const title = role === 'Speaker' ? 'CERTIFICATE OF RECOGNITION' : 'CERTIFICATE OF PARTICIPATION';
  ctx.fillText(title, W / 2, 210);

  ctx.font = 'italic 15px Arial';
  ctx.fillText('This certificate is hereby presented to', W / 2, 245);

  // Participant Name
  ctx.font = 'bold 52px serif'; 
  ctx.fillText(participantName.toUpperCase(), W / 2, 310);

  // Body Content
  ctx.font = '13px Arial';
  const lineSpacing = 18;
  const bodyStartY = 370;
  
  const lines = [
    "for actively participating in the DATA INSIGHTS 2026: Virtual Training Series on Data Mining Concepts, Techniques, and ",
    "Applications",
    "held virtually via Google Meet on ${month} ${day}, ${year} from ${time}, in recognition of commitment to learning",
    "and professional development through active engagement in the training sessions."
  ];

  lines.forEach((line, index) => {
    ctx.fillText(line, W / 2, bodyStartY + (index * lineSpacing));
  });

  ctx.font = '13px Arial';
  ctx.fillText(`Given this ${day}th of ${month}, ${year} at North Eastern Mindanao State University — Lianga Campus,`, W / 2, 475);
  ctx.fillText(`Lianga, Surigao del Sur.`, W / 2, 493);

  ctx.drawImage(logoSig, (W / 2) - 55, 530, 110, 60);
  
  ctx.font = 'bold 14px Arial';
  ctx.fillText('CHRISTINE W. PITOS, MSCS', W / 2, 620);
  ctx.font = '12px Arial';
  ctx.fillText('BSCS Program Coordinator', W / 2, 638);

  const imgData = canvas.toDataURL('image/jpeg', 1.0);
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
