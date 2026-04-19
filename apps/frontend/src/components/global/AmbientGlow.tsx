"use client";

import * as React from "react";
import {
  useAppearanceStore,
  getGlowPreset,
  type GlowMode,
  type GlowPreset,
} from "@/stores/appearance";

interface AmbientGlowProps {
  className?: string;
}

const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uIntensity;
uniform int uMode;

// Base blob positions in UV space, derived from the reference SVG
// (viewBox 1228x800). Each pair is (x, y).
const vec2 P0 = vec2(0.926, 0.455);
const vec2 P1 = vec2(0.188, 0.251);
const vec2 P2 = vec2(0.324, 0.894);
const vec2 P3 = vec2(0.100, 0.032);

// Normalized radius: 315.5 / 1228 of the shorter axis.
const float BASE_RADIUS = 0.38;

float blob(vec2 p, vec2 center, float radius, float aspect) {
  vec2 diff = p - center;
  diff.x *= aspect;
  float d = length(diff);
  // Smooth radial falloff, opacity 0.1 at center → 0 at edge (matches SVG).
  return smoothstep(radius, 0.0, d);
}

float interleavedGradientNoise(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

float hash12(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
    mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + 17.0;
    amplitude *= 0.5;
  }
  return value;
}

vec4 renderAnchoredGlow(vec2 uv, float aspect, float t) {
  // Gentle drift — stays near the SVG anchors when animated.
  vec2 d0 = vec2(cos(t * 0.9 + 0.2), sin(t * 0.7 + 1.1)) * 0.055;
  vec2 d1 = vec2(cos(t * 0.6 + 1.8), sin(t * 1.1 + 0.4)) * 0.065;
  vec2 d2 = vec2(cos(t * 1.2 + 0.9), sin(t * 0.8 + 2.3)) * 0.05;
  vec2 d3 = vec2(cos(t * 0.8 + 2.6), sin(t * 1.0 + 1.7)) * 0.055;

  float b0 = blob(uv, P0 + d0, BASE_RADIUS, aspect);
  float b1 = blob(uv, P1 + d1, BASE_RADIUS, aspect);
  float b2 = blob(uv, P2 + d2, BASE_RADIUS, aspect);
  float b3 = blob(uv, P3 + d3, BASE_RADIUS, aspect);

  // Three blue circles + one accent, matching the SVG palette ratio.
  vec3 c0 = uColorA * b0;
  vec3 c1 = uColorB * b1;
  vec3 c2 = uColorA * b2;
  vec3 c3 = uColorC * b3;

  vec3 color = c0 + c1 + c2 + c3;
  float coverage = b0 + b1 + b2 + b3;
  float alpha = coverage * 0.1 * uIntensity;
  return vec4(color, clamp(alpha, 0.0, 1.0));
}

vec4 renderAurora(vec2 uv, float aspect, float t) {
  float curtain = 0.0;
  float softNoise = fbm(vec2(uv.x * 2.2 + t * 0.035, uv.y * 2.8 - t * 0.02));

  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float waveY =
      0.22 +
      fi * 0.11 +
      0.055 * sin(uv.x * (2.2 + fi * 0.7) + t * (0.18 + fi * 0.04) + fi);
    float displacedY = waveY + (softNoise - 0.5) * 0.15;
    float ribbon = smoothstep(0.22, 0.0, abs(uv.y - displacedY));
    float strands = pow(
      0.5 +
        0.5 *
          sin(
            uv.x * (18.0 + fi * 6.0) +
              softNoise * 8.0 +
              t * (0.42 + fi * 0.09)
          ),
      4.0
    );
    float topFade = smoothstep(0.01, 0.12, uv.y);
    float bottomFade = 1.0 - smoothstep(0.48, 1.02, uv.y);
    curtain += ribbon * (0.28 + strands * 0.72) * topFade * bottomFade;
  }

  vec2 haloSpace = vec2((uv.x - 0.5) * aspect * 0.56, (uv.y - 0.34) * 1.08);
  float halo = 1.0 - smoothstep(0.0, 0.82, length(haloSpace));
  vec3 color = mix(uColorA, uColorB, smoothstep(0.05, 0.95, uv.x));
  color = mix(color, uColorC, clamp(softNoise * 0.4 + curtain * 0.18, 0.0, 0.75));
  float alpha = (curtain * 0.13 + halo * 0.025) * uIntensity;
  return vec4(color, clamp(alpha, 0.0, 0.42));
}

vec4 renderRibbon(vec2 uv, float aspect, float t) {
  float flow = 0.0;
  float softNoise = fbm(vec2(uv.x * 1.8 - t * 0.035, uv.y * 2.4 + t * 0.025));

  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float center =
      0.25 +
      fi * 0.2 +
      0.08 * sin(uv.x * (3.0 + fi * 0.55) + t * (0.22 + fi * 0.07) + fi);
    center += (uv.x - 0.5) * (0.22 - fi * 0.08);
    float band = smoothstep(0.19, 0.0, abs(uv.y - center - (softNoise - 0.5) * 0.14));
    float glimmer =
      0.55 +
      0.45 *
        sin((uv.x * aspect + uv.y) * (7.0 + fi * 1.6) + t * (0.5 + fi * 0.12));
    flow += band * (0.55 + 0.45 * glimmer);
  }

  vec2 bloomSpace = vec2((uv.x - 0.2) * aspect * 0.72, uv.y - 0.72);
  float bloom = 1.0 - smoothstep(0.0, 0.85, length(bloomSpace));
  vec3 color = mix(uColorB, uColorA, smoothstep(0.1, 0.95, uv.y));
  color = mix(color, uColorC, clamp(softNoise * 0.55 + flow * 0.08, 0.0, 0.7));
  float alpha = (flow * 0.105 + bloom * 0.035) * uIntensity;
  return vec4(color, clamp(alpha, 0.0, 0.36));
}

vec4 renderPrism(vec2 uv, float aspect, float t) {
  float sweep = sin(t * 0.45) * 0.08;
  float drift = cos(t * 0.32) * 0.06;
  float beamA =
    smoothstep(
      0.14,
      0.0,
      abs(uv.y - (0.14 + (uv.x + sweep) * 0.78 + 0.05 * sin(t * 0.8 + uv.x * 7.4)))
    );
  float beamB =
    smoothstep(
      0.12,
      0.0,
      abs(uv.y - (0.02 + (uv.x + drift) * 1.02 - 0.045 * sin(t * 0.72 + uv.x * 8.8)))
    );
  float beamC =
    smoothstep(
      0.11,
      0.0,
      abs(uv.y - (0.28 + (uv.x - sweep * 0.7) * 0.62 + 0.038 * cos(t * 0.68 + uv.x * 6.2)))
    );

  float diffraction =
    0.58 +
    0.42 * sin((uv.x * aspect * 11.0 - uv.y * 4.6) + t * 1.05);
  float sparkle = fbm(vec2(uv.x * 3.2 + t * 0.08, uv.y * 3.8 - t * 0.06));
  float caustic =
    0.5 +
    0.5 *
      sin((uv.x * aspect * 15.0 + uv.y * 3.2) - t * 1.25 + sparkle * 3.2);

  vec3 color = uColorA * beamA + uColorB * beamB + uColorC * beamC;
  color += mix(uColorC, uColorA, diffraction) * (beamA + beamB + beamC) * 0.42;
  color += mix(uColorB, uColorC, caustic) * (beamA * 0.22 + beamB * 0.16 + beamC * 0.18);

  float flare =
    (1.0 - smoothstep(0.0, 0.5, length(vec2((uv.x - (0.8 + sweep * 0.35)) * aspect * 1.08, (uv.y - 0.16) * 1.32)))) *
    0.22;
  float alpha =
    ((beamA + beamB + beamC) * (0.085 + diffraction * 0.024) + flare + sparkle * 0.015) *
    uIntensity;
  return vec4(color, clamp(alpha, 0.0, 0.4));
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 uv = vUv;
  // Flip Y so UV (0,0) is top-left like the SVG coordinate system.
  uv.y = 1.0 - uv.y;

  vec4 layer = renderAnchoredGlow(uv, aspect, uTime * 0.05);
  if (uMode == 1) {
    layer = renderAurora(uv, aspect, uTime);
  } else if (uMode == 2) {
    layer = renderRibbon(uv, aspect, uTime);
  } else if (uMode == 3) {
    layer = renderPrism(uv, aspect, uTime);
  }

  float dither = (interleavedGradientNoise(gl_FragCoord.xy) - 0.5) / 255.0;
  float ditherMask = smoothstep(0.0, 0.04, layer.a);
  float alpha = clamp(layer.a + dither * ditherMask * 1.5, 0.0, 1.0);

  // Premultiplied alpha to match gl.blendFunc(ONE, ONE_MINUS_SRC_ALPHA).
  gl_FragColor = vec4(layer.rgb * alpha, alpha);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value = parseInt(
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized,
    16,
  );
  return [
    ((value >> 16) & 0xff) / 255,
    ((value >> 8) & 0xff) / 255,
    (value & 0xff) / 255,
  ];
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return reduced;
}

function modeToShaderMode(mode: GlowMode) {
  if (mode === "aurora") return 1;
  if (mode === "ribbon") return 2;
  if (mode === "prism") return 3;
  return 0;
}

function getFallbackBackground(
  mode: GlowMode,
  colors: GlowPreset["colors"],
) {
  const [a, b, c] = colors;

  if (mode === "aurora") {
    return [
      `linear-gradient(115deg, transparent 4%, ${a}18 26%, ${b}20 52%, transparent 78%)`,
      `linear-gradient(74deg, transparent 12%, ${c}18 38%, transparent 72%)`,
      `radial-gradient(circle at 50% 30%, ${a}18, transparent 54%)`,
    ].join(", ");
  }

  if (mode === "ribbon") {
    return [
      `linear-gradient(145deg, transparent 4%, ${b}18 28%, transparent 58%)`,
      `linear-gradient(28deg, transparent 16%, ${a}1f 46%, transparent 76%)`,
      `radial-gradient(circle at 20% 72%, ${c}18, transparent 44%)`,
    ].join(", ");
  }

  if (mode === "prism") {
    return [
      `linear-gradient(134deg, transparent 8%, ${a}1a 26%, transparent 42%)`,
      `linear-gradient(146deg, transparent 18%, ${b}22 42%, transparent 62%)`,
      `linear-gradient(158deg, transparent 28%, ${c}1c 58%, transparent 76%)`,
      `radial-gradient(circle at 76% 20%, ${a}12, transparent 24%)`,
    ].join(", ");
  }

  return [
    `radial-gradient(circle at 92% 55%, ${a}1a, transparent 38%)`,
    `radial-gradient(circle at 19% 75%, ${b}1a, transparent 38%)`,
    `radial-gradient(circle at 24% 11%, ${a}1a, transparent 38%)`,
    `radial-gradient(circle at 38% 97%, ${c}1a, transparent 38%)`,
  ].join(", ");
}

export default function AmbientGlow({ className }: AmbientGlowProps) {
  const enabled = useAppearanceStore((s) => s.enabled);
  const animated = useAppearanceStore((s) => s.animated);
  const presetId = useAppearanceStore((s) => s.presetId);
  const mode = useAppearanceStore((s) => s.mode);
  const intensity = useAppearanceStore((s) => s.intensity);
  const reducedMotion = usePrefersReducedMotion();

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [webglSupported, setWebglSupported] = React.useState(true);

  const preset = React.useMemo(() => getGlowPreset(presetId), [presetId]);
  const shouldAnimate = animated && !reducedMotion;

  React.useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
    });
    if (!gl) {
      setWebglSupported(false);
      return;
    }

    const program = createProgram(gl);
    if (!program) {
      setWebglSupported(false);
      return;
    }

    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "uTime");
    const uResolution = gl.getUniformLocation(program, "uResolution");
    const uColorA = gl.getUniformLocation(program, "uColorA");
    const uColorB = gl.getUniformLocation(program, "uColorB");
    const uColorC = gl.getUniformLocation(program, "uColorC");
    const uIntensity = gl.getUniformLocation(program, "uIntensity");
    const uMode = gl.getUniformLocation(program, "uMode");

    const [ar, ag, ab] = hexToRgb(preset.colors[0]);
    const [br, bg, bb] = hexToRgb(preset.colors[1]);
    const [cr, cg, cb] = hexToRgb(preset.colors[2]);
    gl.uniform3f(uColorA, ar, ag, ab);
    gl.uniform3f(uColorB, br, bg, bb);
    gl.uniform3f(uColorC, cr, cg, cb);
    gl.uniform1f(uIntensity, intensity);
    gl.uniform1i(uMode, modeToShaderMode(mode));

    let raf = 0;
    let start = performance.now();
    let lastTime = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth, clientHeight } = container;
      const w = Math.max(1, Math.floor(clientWidth * dpr));
      const h = Math.max(1, Math.floor(clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
    };

    const render = (time: number) => {
      resize();
      const elapsed = shouldAnimate ? (time - start) / 1000 : lastTime;
      gl.uniform1f(uTime, elapsed);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (shouldAnimate) {
        lastTime = elapsed;
        raf = requestAnimationFrame(render);
      }
    };

    if (shouldAnimate) {
      raf = requestAnimationFrame(render);
    } else {
      start = performance.now();
      render(start);
    }

    const observer = new ResizeObserver(() => {
      if (!shouldAnimate) {
        render(performance.now());
      }
    });
    observer.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [enabled, shouldAnimate, preset, intensity, mode]);

  if (!enabled) return null;

  if (!webglSupported) {
    return (
      <div
        aria-hidden
        className={className}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          backgroundImage: getFallbackBackground(mode, preset.colors),
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}
