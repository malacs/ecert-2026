import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateCertificate = async (participantName, eventName = 'DATA INSIGHTS 2026') => {
  const canvas = document.createElement('canvas');
  canvas.width = 1123;
  canvas.height = 794;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 1123, 794);
  grad.addColorStop(0, '#1a1060');
  grad.addColorStop(1, '#2d1b8e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1123, 794);

  // Gold border outer
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 6;
  ctx.strokeRect(24, 24, 1075, 746);

  // Gold border inner
  ctx.strokeStyle = '#e8c96d';
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, 1051, 722);

  // Corner ornaments
  const corners = [[50, 50], [1073, 50], [50, 744], [1073, 744]];
  corners.forEach(([x, y]) => {
    ctx.strokeStyle = '#c9a84c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#c9a84c';
    ctx.fill();
  });

  // Header strip
  ctx.fillStyle = 'rgba(201, 168, 76, 0.15)';
  ctx.fillRect(36, 36, 1051, 80);

  // Event name top
  ctx.fillStyle = '#e8c96d';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(eventName, 561, 88);

  // "CERTIFICATE OF PARTICIPATION" title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('CERTIFICATE', 561, 220);
  ctx.font = '32px Georgia, serif';
  ctx.fillStyle = '#e8c96d';
  ctx.fillText('OF PARTICIPATION', 561, 270);

  // Decorative line
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(200, 295);
  ctx.lineTo(923, 295);
  ctx.stroke();

  // "This is to certify that"
  ctx.fillStyle = '#d4c5f5';
  ctx.font = 'italic 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('This is to proudly certify that', 561, 350);

  // Participant name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 58px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#c9a84c';
  ctx.shadowBlur = 15;
  ctx.fillText(participantName, 561, 435);
  ctx.shadowBlur = 0;

  // Underline for name
  const nameWidth = ctx.measureText(participantName).width;
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(561 - nameWidth / 2 - 20, 450);
  ctx.lineTo(561 + nameWidth / 2 + 20, 450);
  ctx.stroke();

  // Description text
  ctx.fillStyle = '#d4c5f5';
  ctx.font = '18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('has successfully participated in the Virtual Training Series on', 561, 500);
  ctx.fillStyle = '#e8c96d';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('Data Mining Concepts, Techniques, and Applications', 561, 530);
  ctx.fillStyle = '#d4c5f5';
  ctx.font = '18px Georgia, serif';
  ctx.fillText('April 15, 17, 22, 24, 29 & May 1, 2026  |  Google Meet', 561, 558);

  // Bottom divider
  ctx.strokeStyle = '#c9a84c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(200, 590);
  ctx.lineTo(923, 590);
  ctx.stroke();

  // Signature lines
  const sigPositions = [220, 561, 902];
  const sigLabels = ['Instructor', 'Program Director', 'Institution Head'];
  sigPositions.forEach((x, i) => {
    ctx.strokeStyle = '#c9a84c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 80, 670);
    ctx.lineTo(x + 80, 670);
    ctx.stroke();
    ctx.fillStyle = '#d4c5f5';
    ctx.font = '14px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(sigLabels[i], x, 690);
  });

  // Footer
  ctx.fillStyle = 'rgba(201, 168, 76, 0.2)';
  ctx.fillRect(36, 718, 1051, 40);
  ctx.fillStyle = '#c9a84c';
  ctx.font = '13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('DATA INSIGHTS 2026  •  Virtual Training Series  •  Issued with honor', 561, 742);

  // Convert to PDF
  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1123, 794] });
  pdf.addImage(imgData, 'PNG', 0, 0, 1123, 794);
  return { pdf, imgData };
};

export const downloadCertificate = async (participantName) => {
  const { pdf } = await generateCertificate(participantName);
  pdf.save(`Certificate_${participantName.replace(/\s+/g, '_')}.pdf`);
};

export const getCertificateDataUrl = async (participantName) => {
  const { imgData } = await generateCertificate(participantName);
  return imgData;
};
