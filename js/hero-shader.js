/* =========================================================
   Fond « vinyle iridescent » de l'accueil (WebGL brut, sans bibliothèque)
   Rendu inspiré de Pryzm (Waves + Iridescence) et des fonds WebGL de
   Componentry (WebGL Liquid, Silk Aurora), reproduit ici en un seul shader.
   Couleurs lues dans les variables du thème (--accent, --accent-2, --accent-3).
   ========================================================= */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_center;
uniform float u_radius;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform float u_light;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 p = (frag - u_center) / u_radius;
  float t = u_time;

  // Légère déformation organique
  float n = noise(p * 1.4 + vec2(t * 0.07, -t * 0.05));
  p += (n - 0.5) * 0.3;

  float r = length(p);
  float a = atan(p.y, p.x);

  // Iridescence : la teinte tourne autour du disque
  float h = a + t * 0.3 + r * 1.6;
  vec3 w = 0.5 + 0.5 * cos(vec3(h, h + 2.094, h + 4.188));
  vec3 col = (u_c1 * w.x + u_c2 * w.y + u_c3 * w.z) / (w.x + w.y + w.z);

  // Ondes sonores qui partent du vinyle
  float waves = pow(0.5 + 0.5 * sin(r * 8.0 - t * 1.4), 3.0);
  float glow = exp(-r * r * 0.5);
  float ring = exp(-pow((r - 1.08) * 3.0, 2.0));
  float intensity = glow * 0.34 + waves * glow * 0.3 + ring * 0.3;

  // Halo secondaire en bas à droite (remplace l'ancien halo CSS)
  vec2 q = frag / u_res;
  vec2 d = (q - vec2(0.88 + 0.04 * sin(t * 0.21), 0.12 + 0.04 * cos(t * 0.17))) * vec2(u_res.x / u_res.y, 1.0);
  float blob = exp(-pow(length(d) * 2.0, 2.0));
  col = mix(col, u_c2, blob * 0.5);
  intensity += blob * 0.22;

  intensity *= mix(1.0, 0.7, u_light);
  intensity = clamp(intensity, 0.0, 1.0);
  gl_FragColor = vec4(col * intensity, intensity);
}
`;

const hexToRgb = (value) => {
  const hex = value.trim().replace('#', '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [0.6, 0.3, 1];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/**
 * Lance le shader sur `canvas`. Renvoie { setActive, setPaused } ou null
 * si WebGL est indisponible (les halos CSS restent alors affichés).
 */
export function initHeroShader(canvas, hero, art) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
  if (!gl) return null;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = (name) => gl.getUniformLocation(prog, name);
  const U = {
    res: u('u_res'), time: u('u_time'), center: u('u_center'), radius: u('u_radius'),
    c1: u('u_c1'), c2: u('u_c2'), c3: u('u_c3'), light: u('u_light'),
  };

  // Rendu à demi-résolution : le fond est flou par nature, inutile de calculer plus de pixels
  const SCALE = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5;
  let w = 1;
  let h = 1;

  const readColors = () => {
    const cs = getComputedStyle(document.documentElement);
    gl.uniform3fv(U.c1, hexToRgb(cs.getPropertyValue('--accent')));
    gl.uniform3fv(U.c2, hexToRgb(cs.getPropertyValue('--accent-2')));
    gl.uniform3fv(U.c3, hexToRgb(cs.getPropertyValue('--accent-3')));
    const bg = hexToRgb(cs.getPropertyValue('--bg'));
    gl.uniform1f(U.light, (bg[0] + bg[1] + bg[2]) / 3 > 0.5 ? 1 : 0);
  };

  const measure = () => {
    const hr = hero.getBoundingClientRect();
    w = Math.max(1, Math.round(hr.width * SCALE));
    h = Math.max(1, Math.round(hr.height * SCALE));
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(U.res, w, h);
    // Centre du vinyle : le disque sort de la pochette de 30 % vers la droite
    const ar = art.getBoundingClientRect();
    const cx = (ar.left - hr.left + ar.width * 0.8) * SCALE;
    const cy = (ar.top - hr.top + ar.height * 0.5) * SCALE;
    gl.uniform2f(U.center, cx, h - cy);
    gl.uniform1f(U.radius, ar.width * 0.46 * SCALE);
  };

  let raf = 0;
  let active = true;
  let paused = false;
  let t = 0;
  let last = 0;

  const draw = () => {
    gl.uniform1f(U.time, t);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now) => {
    raf = 0;
    if (!active || paused || document.hidden) { last = 0; return; }
    if (last) t += Math.min(0.05, (now - last) / 1000);
    last = now;
    draw();
    raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf && active && !paused && !document.hidden) raf = requestAnimationFrame(frame); };

  readColors();
  measure();
  draw();
  new ResizeObserver(() => { measure(); draw(); }).observe(hero);
  // Thème changé (bouton ou système) : nouvelles couleurs
  new MutationObserver(() => { readColors(); draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readColors(); draw(); });
  document.addEventListener('visibilitychange', kick);
  kick();

  return {
    remeasure() { measure(); draw(); },
    setActive(v) { active = v; kick(); },
    setPaused(v) { paused = v; kick(); },
  };
}
