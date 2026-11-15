// Relief on the globe (light theme), drawn by the GPU: a WebGL canvas under the globe's 2D canvas. Each screen pixel
// inside the sphere is mapped back to longitude / latitude (the inverse of d3's orthographic projection with rotation
// [λ, φ, 0], as orthoInvert in lib/relief.ts) and read from the relief texture with smooth filtering, so the image stays
// sharp at every zoom and turns with the globe without redrawing artefacts. The level of detail is chosen from the
// globe's size on screen (no per-pixel derivatives, so there is no seam at ±180°). WebGL 2 uses mipmaps; WebGL 1
// falls back to plain linear filtering. If WebGL isn't available, `create` returns null and the globe keeps its flat
// colours.
import { RELIEF_GLOBE_URL } from './relief';

export interface GlobeView { W: number; H: number; dpr: number; cx: number; cy: number; R: number; rot: [number, number, number] }
export interface ReliefGlobe { ready: () => boolean; render: (v: GlobeView) => void; dispose: () => void }

const VERT2 = `#version 300 es
in vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;
const FRAG2 = `#version 300 es
precision highp float;
uniform sampler2D uTex; uniform vec2 uCenter; uniform float uR, uH, uCp, uSp, uLam, uLod;
out vec4 outColor;
const float PI = 3.141592653589793;
void main() {
  float u = (gl_FragCoord.x - uCenter.x) / uR, v = -((uH - gl_FragCoord.y) - uCenter.y) / uR, rr = u * u + v * v;
  float d = sqrt(rr), a = 1.0 - smoothstep(1.0 - 1.2 / uR, 1.0, d);
  if (a <= 0.0) discard;
  float x = sqrt(max(0.0, 1.0 - rr));
  float lon = atan(u, x * uCp + v * uSp) - uLam, lat = asin(clamp(v * uCp - x * uSp, -1.0, 1.0));
  vec3 c = textureLod(uTex, vec2(fract(lon / (2.0 * PI) + 0.5), 0.5 - lat / PI), uLod).rgb;
  outColor = vec4(c * a, a);
}`;
const VERT1 = `attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;
const FRAG1 = `precision highp float;
uniform sampler2D uTex; uniform vec2 uCenter; uniform float uR, uH, uCp, uSp, uLam, uLod;
const float PI = 3.141592653589793;
void main() {
  float u = (gl_FragCoord.x - uCenter.x) / uR, v = -((uH - gl_FragCoord.y) - uCenter.y) / uR, rr = u * u + v * v;
  float d = sqrt(rr), a = 1.0 - smoothstep(1.0 - 1.2 / uR, 1.0, d);
  if (a <= 0.0) discard;
  float x = sqrt(max(0.0, 1.0 - rr));
  float lon = atan(u, x * uCp + v * uSp) - uLam, lat = asin(clamp(v * uCp - x * uSp, -1.0, 1.0));
  vec3 c = texture2D(uTex, vec2(fract(lon / (2.0 * PI) + 0.5), 0.5 - lat / PI)).rgb;
  gl_FragColor = vec4(c * a, a);
}`;

export function createReliefGlobe(canvas: HTMLCanvasElement): ReliefGlobe | null {
  const opts: WebGLContextAttributes = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false };
  const gl2 = canvas.getContext('webgl2', opts);
  const gl = (gl2 ?? canvas.getContext('webgl', opts)) as WebGLRenderingContext | null;
  if (!gl) return null;
  const v2 = !!gl2;

  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('relief shader', gl.getShaderInfoLog(s)); return null; }
    return s;
  };
  const vs = shader(gl.VERTEX_SHADER, v2 ? VERT2 : VERT1), fs = shader(gl.FRAGMENT_SHADER, v2 ? FRAG2 : FRAG1);
  if (!vs || !fs) return null;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn('relief program', gl.getProgramInfoLog(prog)); return null; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const U = (n: string) => gl.getUniformLocation(prog, n);
  const uCenter = U('uCenter'), uR = U('uR'), uH = U('uH'), uCp = U('uCp'), uSp = U('uSp'), uLam = U('uLam'), uLod = U('uLod');

  let texW = 0, loaded = false, lost = false, lastKey = '';
  const tex = gl.createTexture();
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    if (lost) return;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (v2) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
    else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    texW = img.naturalWidth; loaded = true; lastKey = '';
  };
  img.src = RELIEF_GLOBE_URL;
  const onLost = (e: Event) => { e.preventDefault(); lost = true; loaded = false; };
  canvas.addEventListener('webglcontextlost', onLost);

  return {
    ready: () => loaded && !lost,
    render: ({ W, H, dpr, cx, cy, R, rot }) => {
      if (!loaded || lost) return;
      const w = Math.round(W * dpr), h = Math.round(H * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; lastKey = ''; }
      const key = `${w}x${h}|${cx},${cy},${R.toFixed(3)}|${rot[0].toFixed(4)},${rot[1].toFixed(4)}`;
      if (key === lastKey) return; // the view hasn't moved
      lastKey = key;
      const r = Math.PI / 180, Rd = R * dpr;
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      gl.uniform2f(uCenter, cx * dpr, cy * dpr); gl.uniform1f(uR, Rd); gl.uniform1f(uH, h);
      gl.uniform1f(uCp, Math.cos(rot[1] * r)); gl.uniform1f(uSp, Math.sin(rot[1] * r)); gl.uniform1f(uLam, rot[0] * r);
      // Texels per screen pixel at the centre of the disc: texW / (2π) per radian of longitude over Rd pixels.
      gl.uniform1f(uLod, Math.max(0, Math.log2(texW / (2 * Math.PI) / Rd)));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose: () => {
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.deleteTexture(tex); gl.deleteBuffer(buf); gl.deleteProgram(prog); gl.deleteShader(vs); gl.deleteShader(fs);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
