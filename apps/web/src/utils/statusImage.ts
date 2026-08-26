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
      const imgH = imgW * 1;
      const x = (CANVAS_WIDTH - imgW) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, imageY, imgW, imgH, 24);
      ctx.clip();
      ctx.drawImage(img, x, imageY, imgW, imgH);
      ctx.restore();
      imageY += imgH + 80;
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

  // Link
  const linkY = Math.max(lastY + 120, CANVAS_HEIGHT - 220);
  ctx.fillStyle = '#158F73';
  ctx.font = '36px Inter, sans-serif';
  ctx.fillText('Scanne ou clique ici', CANVAS_WIDTH / 2, linkY);

  ctx.fillStyle = '#1F2937';
  ctx.font = '28px "IBM Plex Mono", monospace';
  wrapText(ctx, shareUrl, CANVAS_WIDTH / 2, linkY + 60, maxWidth, 42);

  return canvas.toDataURL('image/png');
}
