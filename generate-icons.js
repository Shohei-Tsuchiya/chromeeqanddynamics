const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const outDir = __dirname;

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function writePng(filePath, rgba, size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const stride = 1 + size * 4;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    const rowStart = y * stride;
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }

  fs.writeFileSync(filePath, Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0))
  ]));
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function mixColor(c1, c2, t) {
  return {
    r: Math.round(lerp(c1.r, c2.r, t)),
    g: Math.round(lerp(c1.g, c2.g, t)),
    b: Math.round(lerp(c1.b, c2.b, t)),
    a: Math.round(lerp(c1.a, c2.a, t))
  };
}

function setPixel(rgba, size, x, y, color) {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || py < 0 || px >= size || py >= size) return;

  const i = (py * size + px) * 4;
  const srcA = color.a / 255;
  const dstA = rgba[i + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) return;

  rgba[i] = Math.round((color.r * srcA + rgba[i] * dstA * (1 - srcA)) / outA);
  rgba[i + 1] = Math.round((color.g * srcA + rgba[i + 1] * dstA * (1 - srcA)) / outA);
  rgba[i + 2] = Math.round((color.b * srcA + rgba[i + 2] * dstA * (1 - srcA)) / outA);
  rgba[i + 3] = Math.round(outA * 255);
}

function fillCircle(rgba, size, cx, cy, radius, color) {
  const r2 = radius * radius;
  const minX = Math.floor(cx - radius);
  const maxX = Math.ceil(cx + radius);
  const minY = Math.floor(cy - radius);
  const maxY = Math.ceil(cy + radius);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) {
        setPixel(rgba, size, x, y, color);
      }
    }
  }
}

function fillRoundRect(rgba, size, x, y, w, h, radius, color) {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      const left = px - x;
      const right = x + w - px - 1;
      const top = py - y;
      const bottom = y + h - py - 1;
      let inside = true;

      if (left < radius && top < radius) {
        inside = (left - radius) ** 2 + (top - radius) ** 2 <= radius ** 2;
      } else if (right < radius && top < radius) {
        inside = (right - radius) ** 2 + (top - radius) ** 2 <= radius ** 2;
      } else if (left < radius && bottom < radius) {
        inside = (left - radius) ** 2 + (bottom - radius) ** 2 <= radius ** 2;
      } else if (right < radius && bottom < radius) {
        inside = (right - radius) ** 2 + (bottom - radius) ** 2 <= radius ** 2;
      }

      if (inside) setPixel(rgba, size, px, py, color);
    }
  }
}

function drawLine(rgba, size, x0, y0, x1, y1, width, color) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x0 + dx * t;
    const y = y0 + dy * t;
    fillCircle(rgba, size, x, y, width / 2, color);
  }
}

function waveformY(x, size) {
  const t = x / size;
  const center = size * 0.52;
  const amp = size * 0.17;
  return center
    + Math.sin(t * Math.PI * 5.2) * amp * 0.55
    + Math.sin(t * Math.PI * 11.5 + 0.8) * amp * 0.28
    + Math.sin(t * Math.PI * 2.1 + 1.4) * amp * 0.17;
}

function drawWaveform(rgba, size, theme) {
  const padX = size * 0.14;
  const startX = padX;
  const endX = size - padX;
  const steps = Math.max(80, Math.floor(size * 1.4));

  for (let i = 0; i < steps; i++) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const x0 = lerp(startX, endX, t0);
    const x1 = lerp(startX, endX, t1);
    const y0 = waveformY(x0, size);
    const y1 = waveformY(x1, size);

    drawLine(rgba, size, x0, y0, x1, y1, size * 0.09, {
      r: theme.glow.r,
      g: theme.glow.g,
      b: theme.glow.b,
      a: theme.glow.a
    });

    drawLine(rgba, size, x0, y0, x1, y1, size * 0.045, {
      r: theme.wave.r,
      g: theme.wave.g,
      b: theme.wave.b,
      a: theme.wave.a
    });
  }

  const bars = 5;
  for (let i = 0; i < bars; i++) {
    const bx = lerp(startX + size * 0.04, endX - size * 0.04, i / (bars - 1));
    const h = size * (0.08 + 0.12 * Math.abs(Math.sin(i * 1.7 + 0.4)));
    const top = size * 0.82 - h;
    const barW = size * 0.035;
    fillRoundRect(
      rgba,
      size,
      bx - barW / 2,
      top,
      barW,
      h,
      barW / 2,
      mixColor(theme.wave, theme.glow, 0.35)
    );
  }
}

function backgroundColorAt(x, y, size, theme) {
  const nx = x / size;
  const ny = y / size;
  const corner = Math.hypot(clamp(nx, 0.15, 0.85) - 0.5, clamp(ny, 0.15, 0.85) - 0.5);
  const vignette = clamp(1 - corner * 1.15, 0.72, 1);
  const top = mixColor(theme.bgTop, theme.bgBottom, ny);
  return {
    r: Math.round(top.r * vignette),
    g: Math.round(top.g * vignette),
    b: Math.round(top.b * vignette),
    a: 255
  };
}

function createIcon(size, enabled) {
  const rgba = Buffer.alloc(size * size * 4, 0);
  const theme = enabled ? {
    bgTop: { r: 34, g: 58, b: 110, a: 255 },
    bgBottom: { r: 12, g: 18, b: 36, a: 255 },
    wave: { r: 120, g: 235, b: 255, a: 255 },
    glow: { r: 99, g: 170, b: 255, a: 90 }
  } : {
    bgTop: { r: 58, g: 64, b: 76, a: 255 },
    bgBottom: { r: 24, g: 27, b: 34, a: 255 },
    wave: { r: 118, g: 126, b: 142, a: 255 },
    glow: { r: 80, g: 88, b: 102, a: 55 }
  };

  const margin = size * 0.08;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      setPixel(rgba, size, x, y, backgroundColorAt(x, y, size, theme));
    }
  }

  fillRoundRect(
    rgba,
    size,
    margin,
    margin,
    size - margin * 2,
    size - margin * 2,
    size * 0.22,
    { r: 0, g: 0, b: 0, a: enabled ? 28 : 42 }
  );

  if (enabled) {
    fillCircle(rgba, size, size * 0.78, size * 0.24, size * 0.18, {
      r: 56, g: 189, b: 248, a: 36
    });
  }

  drawWaveform(rgba, size, theme);

  return rgba;
}

function saveIconSet(baseName, enabled) {
  [16, 32, 48, 128].forEach(targetSize => {
    const srcSize = 128;
    const src = createIcon(srcSize, enabled);
    const dst = Buffer.alloc(targetSize * targetSize * 4, 0);

    for (let y = 0; y < targetSize; y++) {
      for (let x = 0; x < targetSize; x++) {
        const sx = Math.floor((x + 0.5) * srcSize / targetSize);
        const sy = Math.floor((y + 0.5) * srcSize / targetSize);
        const si = (sy * srcSize + sx) * 4;
        const di = (y * targetSize + x) * 4;
        dst[di] = src[si];
        dst[di + 1] = src[si + 1];
        dst[di + 2] = src[si + 2];
        dst[di + 3] = src[si + 3];
      }
    }

    const suffix = targetSize === 128 ? '' : `-${targetSize}`;
    writePng(path.join(outDir, `${baseName}${suffix}.png`), dst, targetSize);
  });
}

saveIconSet('icon', true);
saveIconSet('icon_disabled', false);

writePng(path.join(outDir, 'icon.png'), createIcon(128, true), 128);
writePng(path.join(outDir, 'icon_disabled.png'), createIcon(128, false), 128);

console.log('Waveform icons generated.');
