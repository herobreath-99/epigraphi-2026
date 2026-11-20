/**
 * Professional AI-style image enhancement pipeline for ancient inscriptions.
 *
 * Pipeline (mirrors OpenCV approach):
 *   1. Auto-Levels         — histogram stretch
 *   2. Bilateral Denoise   — edge-preserving noise removal
 *   3. Super-Resolution    — bicubic ×1.5 upscaling for fine detail
 *   4. CLAHE               — tile-based adaptive contrast (real CLAHE)
 *   5. Top-Hat Morphology  — reveals carved grooves under uneven lighting
 *   6. Unsharp Mask        — high-precision edge sharpening
 *   7. Inscription Glow    — Sobel edge detection + golden/cyan luminescence
 */

export interface EnhancementStep {
  name: string;
  label: string;
  apply: (ctx: CanvasRenderingContext2D, w: number, h: number) => CanvasRenderingContext2D | void;
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/* ───────────────────────────── 1. Auto Levels ───────────────────────────── */
function applyAutoLevels(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;

  // Build luminance histogram and clip 1% tails for robust min/max
  const hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) {
    const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) | 0;
    hist[lum]++;
  }
  const total = (w * h) | 0;
  const clip = Math.floor(total * 0.01);
  let acc = 0, min = 0, max = 255;
  for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc > clip) { min = i; break; } }
  acc = 0;
  for (let i = 255; i >= 0; i--) { acc += hist[i]; if (acc > clip) { max = i; break; } }

  const range = Math.max(1, max - min);
  for (let i = 0; i < d.length; i += 4) {
    d[i] = clamp(((d[i] - min) / range) * 255);
    d[i + 1] = clamp(((d[i + 1] - min) / range) * 255);
    d[i + 2] = clamp(((d[i + 2] - min) / range) * 255);
  }
  ctx.putImageData(imageData, 0, 0);
}

/* ───────────────────────── 2. Bilateral-like Denoise ─────────────────────── */
function applyBilateralDenoise(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const src = new Uint8ClampedArray(imageData.data);
  const d = imageData.data;
  const sigmaR = 28;        // intensity sigma
  const sigmaR2 = 2 * sigmaR * sigmaR;
  const radius = 2;

  for (let y = radius; y < h - radius; y++) {
    for (let x = radius; x < w - radius; x++) {
      const ci = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = src[ci + c];
        let sum = 0, wsum = 0;
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const ni = ((y + ky) * w + (x + kx)) * 4 + c;
            const diff = src[ni] - center;
            const wr = Math.exp(-(diff * diff) / sigmaR2);
            sum += src[ni] * wr;
            wsum += wr;
          }
        }
        d[ci + c] = wsum > 0 ? Math.round(sum / wsum) : center;
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

/* ─────────────────── 3. Super-Resolution (bicubic ×1.5) ──────────────────── */
function applySuperResolution(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const SCALE = 1.5;
  const MAX_DIM = 1800; // safety cap
  let nw = Math.round(w * SCALE);
  let nh = Math.round(h * SCALE);
  if (nw > MAX_DIM || nh > MAX_DIM) {
    const r = MAX_DIM / Math.max(nw, nh);
    nw = Math.round(nw * r);
    nh = Math.round(nh * r);
  }

  // Capture current frame
  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = w;
  srcCanvas.height = h;
  srcCanvas.getContext("2d")!.drawImage(ctx.canvas, 0, 0);

  // Resize the host canvas with high-quality interpolation
  ctx.canvas.width = nw;
  ctx.canvas.height = nh;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(srcCanvas, 0, 0, nw, nh);
}

/* ─────────────────── 4. CLAHE (Tile-based Adaptive) ──────────────────────── */
function applyCLAHE(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  const tilesX = 8, tilesY = 8;
  const tileW = Math.ceil(w / tilesX);
  const tileH = Math.ceil(h / tilesY);
  const clipLimit = 0.01; // fraction of pixels per bin before clipping

  // Compute clipped CDF for each tile (luminance only)
  const cdfs: Uint8Array[] = [];
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const x0 = tx * tileW, y0 = ty * tileH;
      const x1 = Math.min(w, x0 + tileW), y1 = Math.min(h, y0 + tileH);
      const hist = new Uint32Array(256);
      let count = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * w + x) * 4;
          const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) | 0;
          hist[lum]++; count++;
        }
      }
      // Clip and redistribute
      const limit = Math.max(1, Math.floor(clipLimit * count));
      let excess = 0;
      for (let i = 0; i < 256; i++) if (hist[i] > limit) { excess += hist[i] - limit; hist[i] = limit; }
      const add = Math.floor(excess / 256);
      for (let i = 0; i < 256; i++) hist[i] += add;
      // Build CDF lookup
      const cdf = new Uint8Array(256);
      let acc = 0;
      const norm = count > 0 ? 255 / count : 0;
      for (let i = 0; i < 256; i++) { acc += hist[i]; cdf[i] = clamp(acc * norm); }
      cdfs.push(cdf);
    }
  }

  // Bilinear interpolation between neighboring tile CDFs
  for (let y = 0; y < h; y++) {
    const fy = y / tileH - 0.5;
    const ty0 = Math.max(0, Math.min(tilesY - 1, Math.floor(fy)));
    const ty1 = Math.max(0, Math.min(tilesY - 1, ty0 + 1));
    const wy = Math.max(0, Math.min(1, fy - ty0));
    for (let x = 0; x < w; x++) {
      const fx = x / tileW - 0.5;
      const tx0 = Math.max(0, Math.min(tilesX - 1, Math.floor(fx)));
      const tx1 = Math.max(0, Math.min(tilesX - 1, tx0 + 1));
      const wx = Math.max(0, Math.min(1, fx - tx0));

      const i = (y * w + x) * 4;
      const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) | 0;
      const v00 = cdfs[ty0 * tilesX + tx0][lum];
      const v01 = cdfs[ty0 * tilesX + tx1][lum];
      const v10 = cdfs[ty1 * tilesX + tx0][lum];
      const v11 = cdfs[ty1 * tilesX + tx1][lum];
      const top = v00 * (1 - wx) + v01 * wx;
      const bot = v10 * (1 - wx) + v11 * wx;
      const newLum = top * (1 - wy) + bot * wy;

      // Scale RGB proportionally to preserve color
      const ratio = lum > 0 ? newLum / lum : 1;
      d[i]     = clamp(d[i] * ratio);
      d[i + 1] = clamp(d[i + 1] * ratio);
      d[i + 2] = clamp(d[i + 2] * ratio);
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

/* ─────────────── 5. Top-Hat Morphology (reveals carved grooves) ──────────── */
function applyTopHat(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;

  // Extract luminance channel
  const lum = new Uint8ClampedArray(w * h);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    lum[p] = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) | 0;
  }

  const r = 3; // structuring element radius (7x7)
  const eroded = new Uint8ClampedArray(w * h);
  const opened = new Uint8ClampedArray(w * h);

  // Erosion (min filter)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let mn = 255;
      for (let ky = -r; ky <= r; ky++) {
        const yy = y + ky; if (yy < 0 || yy >= h) continue;
        for (let kx = -r; kx <= r; kx++) {
          const xx = x + kx; if (xx < 0 || xx >= w) continue;
          const v = lum[yy * w + xx];
          if (v < mn) mn = v;
        }
      }
      eroded[y * w + x] = mn;
    }
  }
  // Dilation on eroded => opening
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let mx = 0;
      for (let ky = -r; ky <= r; ky++) {
        const yy = y + ky; if (yy < 0 || yy >= h) continue;
        for (let kx = -r; kx <= r; kx++) {
          const xx = x + kx; if (xx < 0 || xx >= w) continue;
          const v = eroded[yy * w + xx];
          if (v > mx) mx = v;
        }
      }
      opened[y * w + x] = mx;
    }
  }

  // Black Top-Hat = opening - original  → highlights dark carved grooves
  // Add it back to brighten/reveal letters
  for (let p = 0, i = 0; p < lum.length; p++, i += 4) {
    const tophat = Math.max(0, opened[p] - lum[p]);
    const boost = tophat * 1.4;
    d[i]     = clamp(d[i] + boost);
    d[i + 1] = clamp(d[i + 1] + boost);
    d[i + 2] = clamp(d[i + 2] + boost);
  }
  ctx.putImageData(imageData, 0, 0);
}

/* ───────────────────────── 6. Unsharp Mask Sharpen ───────────────────────── */
function applyUnsharpMask(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const src = new Uint8ClampedArray(imageData.data);
  const d = imageData.data;
  // 3x3 sharpening kernel (5,-1)
  const k = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const di = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        let v = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            v += src[((y + ky) * w + (x + kx)) * 4 + c] * k[(ky + 1) * 3 + (kx + 1)];
          }
        }
        d[di + c] = clamp(v);
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

/* ──────────────── 7. Inscription Glow (Sobel + gold/cyan) ───────────────── */
function applyInscriptionGlow(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const src = new Uint8ClampedArray(imageData.data);
  const d = imageData.data;
  const edges = new Float32Array(w * h);
  const sx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let gx = 0, gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * w + (x + kx)) * 4;
          const lum = 0.299 * src[idx] + 0.587 * src[idx + 1] + 0.114 * src[idx + 2];
          const ki = (ky + 1) * 3 + (kx + 1);
          gx += lum * sx[ki];
          gy += lum * sy[ki];
        }
      }
      edges[y * w + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  let mx = 1;
  for (let i = 0; i < edges.length; i++) if (edges[i] > mx) mx = edges[i];

  // Build per-channel glow maps (gold tone) from edge magnitude
  const glowR = new Float32Array(w * h);
  const glowG = new Float32Array(w * h);
  const glowB = new Float32Array(w * h);
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i] / mx;
    if (e > 0.08) {
      // Strong gold core — hsl(43, 88%, 63%) ≈ (244, 191, 70)
      const v = Math.min(1, e * 1.6);
      glowR[i] = 255 * v;
      glowG[i] = 210 * v;
      glowB[i] = 90  * v;
    }
  }

  // Multi-pass box blur on glow channels → soft halo (Bloom)
  const blur = (buf: Float32Array, radius: number) => {
    const tmp = new Float32Array(buf.length);
    const norm = 1 / (radius * 2 + 1);
    // horizontal
    for (let y = 0; y < h; y++) {
      let acc = 0;
      for (let x = -radius; x <= radius; x++) acc += buf[y * w + Math.max(0, Math.min(w - 1, x))];
      for (let x = 0; x < w; x++) {
        tmp[y * w + x] = acc * norm;
        const xOut = Math.max(0, Math.min(w - 1, x - radius));
        const xIn  = Math.max(0, Math.min(w - 1, x + radius + 1));
        acc += buf[y * w + xIn] - buf[y * w + xOut];
      }
    }
    // vertical
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -radius; y <= radius; y++) acc += tmp[Math.max(0, Math.min(h - 1, y)) * w + x];
      for (let y = 0; y < h; y++) {
        buf[y * w + x] = acc * norm;
        const yOut = Math.max(0, Math.min(h - 1, y - radius));
        const yIn  = Math.max(0, Math.min(h - 1, y + radius + 1));
        acc += tmp[yIn * w + x] - tmp[yOut * w + x];
      }
    }
  };

  // Two-scale bloom: tight inner glow + wide outer halo
  const innerR = Math.max(2, Math.round(Math.min(w, h) * 0.004));
  const outerR = Math.max(6, Math.round(Math.min(w, h) * 0.018));

  const innerR_ = new Float32Array(glowR);
  const innerG_ = new Float32Array(glowG);
  const innerB_ = new Float32Array(glowB);
  blur(innerR_, innerR); blur(innerG_, innerR); blur(innerB_, innerR);

  const outerR_ = new Float32Array(glowR);
  const outerG_ = new Float32Array(glowG);
  const outerB_ = new Float32Array(glowB);
  blur(outerR_, outerR); blur(outerG_, outerR); blur(outerB_, outerR);

  // Screen-blend bloom onto the image: out = 1 - (1-base)*(1-glow)
  for (let p = 0, i = 0; p < w * h; p++, i += 4) {
    const gR = Math.min(255, innerR_[p] * 1.4 + outerR_[p] * 0.9);
    const gG = Math.min(255, innerG_[p] * 1.4 + outerG_[p] * 0.9);
    const gB = Math.min(255, innerB_[p] * 1.4 + outerB_[p] * 0.9);

    const br = d[i] / 255, bg = d[i + 1] / 255, bb = d[i + 2] / 255;
    const lr = gR / 255,   lg = gG / 255,       lb = gB / 255;
    d[i]     = clamp((1 - (1 - br) * (1 - lr)) * 255);
    d[i + 1] = clamp((1 - (1 - bg) * (1 - lg)) * 255);
    d[i + 2] = clamp((1 - (1 - bb) * (1 - lb)) * 255);
  }
  ctx.putImageData(imageData, 0, 0);
}

export const enhancementSteps: EnhancementStep[] = [
  { name: "autoLevels",  label: "ضبط المستويات تلقائيًا",      apply: applyAutoLevels },
  { name: "denoise",     label: "تنقية ثنائية حافظة للحواف",   apply: applyBilateralDenoise },
  { name: "superRes",    label: "تكبير ذكي ×1.5 (Super-Res)",  apply: applySuperResolution },
  { name: "clahe",       label: "تباين تكيّفي CLAHE",            apply: applyCLAHE },
  { name: "tophat",      label: "كشف الحروف المحفورة (Top-Hat)", apply: applyTopHat },
  { name: "sharpen",     label: "إبراز النقوش (Unsharp Mask)",   apply: applyUnsharpMask },
  { name: "glow",        label: "إضاءة الحروف المخفية",          apply: applyInscriptionGlow },
];

export interface EnhanceResult {
  originalDataUrl: string;
  enhancedDataUrl: string;
}

/**
 * Run the full enhancement pipeline on an image data URL.
 * Calls onProgress(stepIndex, stepLabel) for each step.
 */
export async function enhanceImage(
  dataUrl: string,
  onProgress?: (step: number, label: string) => void
): Promise<EnhanceResult> {
  const img = await loadImage(dataUrl);

  // Cap input size for performance (long edge ≤ 1280 before SR upscale)
  const MAX_INPUT = 1280;
  let iw = img.width, ih = img.height;
  if (Math.max(iw, ih) > MAX_INPUT) {
    const r = MAX_INPUT / Math.max(iw, ih);
    iw = Math.round(iw * r);
    ih = Math.round(ih * r);
  }

  const canvas = document.createElement("canvas");
  canvas.width = iw;
  canvas.height = ih;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, iw, ih);

  for (let i = 0; i < enhancementSteps.length; i++) {
    onProgress?.(i, enhancementSteps[i].label);
    await new Promise((r) => setTimeout(r, 80));
    enhancementSteps[i].apply(ctx, canvas.width, canvas.height);
  }

  onProgress?.(enhancementSteps.length, "اكتمل التحسين");

  return {
    originalDataUrl: dataUrl,
    enhancedDataUrl: canvas.toDataURL("image/jpeg", 0.92),
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}