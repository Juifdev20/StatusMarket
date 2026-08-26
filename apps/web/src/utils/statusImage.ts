const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;
const PADDING = 80;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let lineY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, lineY);
      line = words[i] + ' ';
      lineY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, lineY);
  return lineY;
}

export interface StatusImageOptions {
  coverImage?: string | null;
  shareMessage: string;
  shareUrl: string;
  storeName: string;
}

export async function generateStatusImage({
  coverImage,
  shareMessage,
  shareUrl,
  storeName,
}: StatusImageOptions): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#158F73');
  gradient.addColorStop(1, '#0D5E4A');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Card
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(PADDING, 200, CANVAS_WIDTH - PADDING * 2, CANVAS_HEIGHT - 400, 32);
  ctx.fill();

  // Store name
  ctx.fillStyle = '#158F73';
  ctx.font = 'bold 48px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(storeName, CANVAS_WIDTH / 2, 300);

  // StatusMarket brand
  ctx.fillStyle = '#6B7280';
  ctx.font = '32px Inter, sans-serif';
  ctx.fillText('sur StatusMarket', CANVAS_WIDTH / 2, 350);

  // Cover image
  let imageY = 430;
  if (coverImage) {
    try {
      const img = await loadImage(coverImage);
      const imgW = CANVAS_WIDTH - PADDING * 4;
      const imgH = imgW * 0.75;
      const x = (CANVAS_WIDTH - imgW) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, imageY, imgW, imgH, 24);
      ctx.clip();
      ctx.drawImage(img, x, imageY, imgW, imgH);
      ctx.restore();
      imageY += imgH + 60;
    } catch {
      // fallback if image fails to load
    }
  }

  // Message
  ctx.fillStyle = '#1F2937';
  ctx.font = 'bold 44px Inter, sans-serif';
  ctx.textAlign = 'center';
  const maxWidth = CANVAS_WIDTH - PADDING * 4;
  const lastY = wrapText(ctx, shareMessage, CANVAS_WIDTH / 2, imageY, maxWidth, 64);

  // QR code
  const qrSize = 360;
  const qrX = (CANVAS_WIDTH - qrSize) / 2;
  const qrY = Math.max(lastY + 80, CANVAS_HEIGHT - 560);
  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(shareUrl)}`;
    const qrImg = await loadImage(qrUrl);
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(qrX, qrY, qrSize, qrSize, 24);
    ctx.clip();
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    ctx.restore();
  } catch {
    // QR code failed
  }

  // Link
  const linkY = qrY + qrSize + 70;
  ctx.fillStyle = '#6B7280';
  ctx.font = '28px "IBM Plex Mono", monospace';
  wrapText(ctx, shareUrl, CANVAS_WIDTH / 2, linkY, maxWidth, 42);

  // Scan hint
  ctx.fillStyle = '#158F73';
  ctx.font = '32px Inter, sans-serif';
  ctx.fillText('Scanne ce QR code pour voir les produits', CANVAS_WIDTH / 2, linkY + 80);

  return canvas.toDataURL('image/png');
}
