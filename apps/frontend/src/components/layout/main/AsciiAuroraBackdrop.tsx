"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface AsciiAuroraBackdropProps {
  className?: string;
}

type RgbColor = [number, number, number];

interface BackdropLayout {
  cssWidth: number;
  cssHeight: number;
  pixelWidth: number;
  pixelHeight: number;
  dpr: number;
  fontSize: number;
  cellWidth: number;
  cellHeight: number;
  columns: number;
  rows: number;
  centerX: number;
  centerY: number;
  streamSafeRadius: number;
  clearMask: Float32Array;
}

const DENSITY_RAMP = " .,:-+*#%@";
const STREAM_CHARS = "|/:";
const SPARK_CHARS = ".+*";
const BACKDROP_TARGET_FPS = 12;
const BACKDROP_MAX_RENDER_DPR = 1;
const BACKDROP_MIN_FONT_SIZE = 12;
const BACKDROP_MAX_FONT_SIZE = 20;
const BACKDROP_CELL_WIDTH_RATIO = 0.68;
const BACKDROP_CELL_HEIGHT_RATIO = 1.24;

const AURORA_PALETTE: RgbColor[] = [
  [2, 18, 12],
  [4, 40, 26],
  [8, 74, 48],
  [18, 118, 76],
  [30, 172, 110],
  [72, 232, 156],
  [170, 255, 218],
];

const TEXT_PALETTE: RgbColor[] = [
  [16, 84, 52],
  [26, 142, 88],
  [44, 214, 128],
  [112, 255, 184],
  [194, 255, 230],
];

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

function interpolateColor(palette: RgbColor[], amount: number): RgbColor {
  const normalized = clamp(amount);
  const scaled = normalized * (palette.length - 1);
  const index = Math.floor(scaled);
  const nextIndex = Math.min(index + 1, palette.length - 1);
  const blend = scaled - index;
  const [r1, g1, b1] = palette[index];
  const [r2, g2, b2] = palette[nextIndex];

  return [
    Math.round(lerp(r1, r2, blend)),
    Math.round(lerp(g1, g2, blend)),
    Math.round(lerp(b1, b2, blend)),
  ];
}

function colorToRgba([r, g, b]: RgbColor, alpha: number) {
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha)})`;
}

function auroraField(x: number, y: number, width: number, height: number, time: number) {
  const nx = x / Math.max(width - 1, 1);
  const ny = y / Math.max(height - 1, 1);

  const ridgeCenter =
    0.28 +
    0.16 * Math.sin(nx * 4.4 + time * 0.65) +
    0.05 * Math.sin(nx * 12.0 - time * 1.3);
  const ridge = Math.exp(-(((ny - ridgeCenter) * 6.5) ** 2));
  const weave =
    0.5 +
    0.5 * Math.sin(nx * 10.0 - time * 1.2 + Math.sin(ny * 8.0 + time * 0.8));
  const ripple = 0.5 + 0.5 * Math.sin(nx * 13.0 + ny * 6.0 - time * 1.8);
  const pulse = 0.5 + 0.5 * Math.sin((nx - ny * 0.35) * 18.0 + time * 2.2);
  const vignette = clamp(
    1.15 - ((nx - 0.5) ** 2 * 2.2 + (ny - 0.46) ** 2 * 3.2),
    0.15,
    1,
  );

  const value = ridge * (0.55 + weave * 0.7) + ripple * 0.12 + pulse * 0.08;
  return clamp(value * vignette);
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return reduced;
}

function buildBackdropLayout(cssWidth: number, cssHeight: number, dpr: number): BackdropLayout {
  const pixelWidth = Math.max(1, Math.floor(cssWidth * dpr));
  const pixelHeight = Math.max(1, Math.floor(cssHeight * dpr));
  const fontSize =
    Math.max(BACKDROP_MIN_FONT_SIZE, Math.min(BACKDROP_MAX_FONT_SIZE, cssWidth / 64)) *
    dpr;
  const cellWidth = fontSize * BACKDROP_CELL_WIDTH_RATIO;
  const cellHeight = fontSize * BACKDROP_CELL_HEIGHT_RATIO;
  const columns = Math.max(26, Math.floor(pixelWidth / cellWidth));
  const rows = Math.max(14, Math.floor(pixelHeight / cellHeight));
  const centerX = columns / 2;
  const centerY = rows / 2;
  const logoClearRadiusX = columns * (cssWidth > 900 ? 0.15 : 0.17);
  const logoClearRadiusY = rows * (cssHeight > 680 ? 0.13 : 0.15);
  const clearMask = new Float32Array(columns * rows);

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const dx = (column - centerX) / Math.max(logoClearRadiusX, 1);
      const dy = (row - centerY) / Math.max(logoClearRadiusY, 1);
      clearMask[row * columns + column] = clamp(1.08 - Math.sqrt(dx * dx + dy * dy));
    }
  }

  return {
    cssWidth,
    cssHeight,
    pixelWidth,
    pixelHeight,
    dpr,
    fontSize,
    cellWidth,
    cellHeight,
    columns,
    rows,
    centerX,
    centerY,
    streamSafeRadius: logoClearRadiusX * 0.74,
    clearMask,
  };
}

export default function AsciiAuroraBackdrop({
  className,
}: AsciiAuroraBackdropProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    let animationFrame = 0;
    let resizeFrame = 0;
    let lastRender = 0;
    let layout = buildBackdropLayout(1, 1, 1);

    const renderFrame = (elapsed: number) => {
      const {
        pixelWidth,
        pixelHeight,
        fontSize,
        cellWidth,
        cellHeight,
        columns,
        rows,
        centerX,
        centerY,
        streamSafeRadius,
        clearMask,
      } = layout;
      if (pixelWidth <= 0 || pixelHeight <= 0) {
        return;
      }

      context.clearRect(0, 0, pixelWidth, pixelHeight);

      const drawGlyph = (
        character: string,
        column: number,
        row: number,
        color: RgbColor,
        alpha: number,
        blur = 0,
      ) => {
        const x = column * cellWidth;
        const y = row * cellHeight;
        context.fillStyle = colorToRgba(color, alpha);
        context.shadowBlur = blur;
        context.shadowColor =
          blur > 0 ? colorToRgba(color, alpha * 0.72) : "transparent";
        context.fillText(character, x, y);
      };

      context.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace`;
      context.textBaseline = "top";
      context.textAlign = "left";

      for (let row = 0; row < rows; row += 1) {
        const rowOffset = row * columns;
        for (let column = 0; column < columns; column += 1) {
          const intensity = auroraField(column, row, columns, rows, elapsed);
          if (intensity < 0.06) {
            continue;
          }

          const hush = clearMask[rowOffset + column];
          if (hush > 0.14) {
            continue;
          }

          const rampIndex = Math.floor(
            clamp(intensity ** 0.92) * (DENSITY_RAMP.length - 1),
          );
          const character = DENSITY_RAMP[rampIndex] ?? DENSITY_RAMP[0];
          const color = interpolateColor(AURORA_PALETTE, intensity ** 0.8);
          drawGlyph(
            character,
            column,
            row,
            color,
            0.18 + intensity * 0.48,
          );
        }
      }

      const streamCount = Math.max(10, Math.floor(columns / 7));
      for (let index = 0; index < streamCount; index += 1) {
        const baseX = Math.floor(((index + 0.5) / streamCount) * columns);
        const offsetX = Math.round(3 * Math.sin(elapsed * 0.55 + index * 1.7));
        const column = baseX + offsetX;
        if (Math.abs(column - centerX) < streamSafeRadius) {
          continue;
        }

        const speed = 6 + (index % 4) * 1.1;
        const head = Math.floor((elapsed * speed + index * 5.3) % (rows + 14)) - 7;
        const length = 4 + (index % 5);
        for (let step = 0; step < length; step += 1) {
          const row = head - step;
          if (row < 0 || row >= rows) {
            continue;
          }

          const hush = clearMask[row * columns + column];
          if (hush > 0.08) {
            continue;
          }

          const strength = 1 - step / Math.max(length, 1);
          const character = STREAM_CHARS[Math.min(step, STREAM_CHARS.length - 1)];
          const color = interpolateColor(TEXT_PALETTE, 0.35 + strength * 0.5);
          drawGlyph(
            character,
            column,
            row,
            color,
            0.28 + strength * 0.42,
            fontSize * 0.16,
          );
        }
      }

      const sparkCount = Math.max(14, Math.floor(columns / 4));
      const orbitX = columns * 0.32;
      const orbitY = rows * 0.34;
      for (let index = 0; index < sparkCount; index += 1) {
        const angle = elapsed * 0.5 + index * 0.78;
        const drift = 1 + 0.16 * Math.sin(elapsed * 1.4 + index * 0.6);
        const column = Math.round(
          centerX +
            Math.cos(angle) * orbitX * drift +
            Math.sin(elapsed * 1.2 + index) * 2.2,
        );
        const row = Math.round(
          centerY + Math.sin(angle * 1.3) * orbitY * 0.45,
        );

        if (column < 0 || column >= columns || row < 0 || row >= rows) {
          continue;
        }

        const hush = clearMask[row * columns + column];
        if (hush > 0.1) {
          continue;
        }

        const sparkle = 0.6 + 0.4 * Math.sin(elapsed * 5 + index * 1.1);
        const character = SPARK_CHARS[index % SPARK_CHARS.length];
        const color = interpolateColor(TEXT_PALETTE, 0.55 + sparkle * 0.35);
        drawGlyph(
          character,
          column,
          row,
          color,
          0.32 + sparkle * 0.4,
          fontSize * 0.18,
        );
      }

      context.shadowBlur = 0;
    };

    const resizeCanvas = () => {
      const cssWidth = Math.max(container.clientWidth, 1);
      const cssHeight = Math.max(container.clientHeight, 1);
      const dpr = Math.min(window.devicePixelRatio || 1, BACKDROP_MAX_RENDER_DPR);
      layout = buildBackdropLayout(cssWidth, cssHeight, dpr);

      if (canvas.width !== layout.pixelWidth || canvas.height !== layout.pixelHeight) {
        canvas.width = layout.pixelWidth;
        canvas.height = layout.pixelHeight;
      }
    };

    const scheduleResize = () => {
      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame);
      }

      resizeFrame = window.requestAnimationFrame(() => {
        resizeCanvas();
        if (reducedMotion) {
          renderFrame(0);
        }
      });
    };

    resizeCanvas();

    if (reducedMotion) {
      renderFrame(0);
    } else {
      const start = performance.now();
      const loop = (now: number) => {
        if (!lastRender || now - lastRender >= 1000 / BACKDROP_TARGET_FPS) {
          renderFrame((now - start) / 1000);
          lastRender = now;
        }
        animationFrame = window.requestAnimationFrame(loop);
      };
      animationFrame = window.requestAnimationFrame(loop);
    }

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(scheduleResize)
        : null;
    resizeObserver?.observe(container);
    window.addEventListener("resize", scheduleResize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(resizeFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleResize);
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <canvas
        ref={canvasRef}
        className="size-full opacity-[0.92] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.92),rgba(0,0,0,0.86),rgba(0,0,0,0.58))]"
      />
    </div>
  );
}
