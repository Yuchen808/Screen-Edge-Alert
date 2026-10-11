// 屏幕边缘光 + 右下角宇宙色晕染（单个全屏 fragment shader）
// 边缘光：Apple Intelligence 式多层叠加（细亮线 + 中/宽/环境三层衰减），颜色沿屏幕一圈的角向渐变缓慢漂移
// 晕染：绿核 → 品红/紫星云 → 深梅色暗晕，fbm 域扭曲做星云质感
// 输出预乘 alpha，软 tone-map 防止过曝发硬，并加抖动消除色带

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes; uniform vec2 uCorner; uniform float uTime, uEdge, uBloom, uDpr;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){ v += a * noise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p; a *= 0.5; }
  return v;
}
// 宇宙色盘：30·30 绿 → 青 → 靛 → 紫 → 品红 → 粉（循环）
vec3 pal(float t){
  t = fract(t) * 6.0;
  vec3 c = vec3(0.502, 0.937, 0.502);
  c = mix(c, vec3(0.247, 0.878, 0.773), smoothstep(0.0, 1.0, clamp(t,       0.0, 1.0)));
  c = mix(c, vec3(0.486, 0.549, 1.000), smoothstep(0.0, 1.0, clamp(t - 1.0, 0.0, 1.0)));
  c = mix(c, vec3(0.710, 0.424, 1.000), smoothstep(0.0, 1.0, clamp(t - 2.0, 0.0, 1.0)));
  c = mix(c, vec3(1.000, 0.310, 0.640), smoothstep(0.0, 1.0, clamp(t - 3.0, 0.0, 1.0)));
  c = mix(c, vec3(1.000, 0.560, 0.784), smoothstep(0.0, 1.0, clamp(t - 4.0, 0.0, 1.0)));
  c = mix(c, vec3(0.502, 0.937, 0.502), smoothstep(0.0, 1.0, clamp(t - 5.0, 0.0, 1.0)));
  return c;
}
float sdRoundBox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }

void main(){
  vec2 p = gl_FragCoord.xy;
  vec2 hres = uRes * 0.5;
  float t = uTime;
  vec3 E = vec3(0.0);
  float D = 0.0;

  // ---- 边缘光 ----
  if (uEdge > 0.001) {
    float dd = max(-sdRoundBox(p - hres, hres, 18.0 * uDpr), 0.0) / uDpr;   // 到屏幕边的距离（CSS px）
    float grow = 0.35 + 0.65 * uEdge;                                        // 入场时光从边缘向内长
    float x = dd / grow;
    float w = 2.0 / (x + 2.0) * exp(-x / 6.0) * 0.95                         // 细亮线（Lorentzian）
            + exp(-x / 14.0) * 0.70
            + exp(-x / 42.0) * 0.38
            + exp(-x / 130.0) * 0.12;
    float a = atan(p.y - hres.y, p.x - hres.x) / 6.2831853;
    float hue = a + 0.10 * sin(t * 0.55 + a * 12.566) + 0.06 * sin(t * 0.31 - a * 25.13) + t * 0.03;
    float mod_ = 0.72 + 0.28 * noise(vec2(a * 9.0, t * 0.5));
    float near = 1.0;                                                         // 四边均匀，不再偏亮右下角
    E += pal(hue) * w * mod_ * near * uEdge;
  }

  // ---- 右下角晕染 ----
  if (uBloom > 0.001) {
    vec2 rel = (p - uCorner) / uDpr;
    float S = 470.0 * uBloom * (1.0 + 0.035 * sin(t * 2.1));
    vec2 wv = vec2(fbm(rel / 170.0 + vec2(t * 0.07, 0.0)), fbm(rel / 170.0 + vec2(5.2, -t * 0.06))) - 0.5;
    vec2 rw = rel + wv * 55.0 * uBloom;
    float r = length(rw) / max(S, 1.0);
    float neb = fbm(rw / 120.0 + vec2(t * 0.045, -t * 0.035));

    // 绿核（参考图中心；圆心在角尖，屏幕上只露出四分之一，所以半径放大）
    float gc = exp(-pow(r / 0.42, 2.0));
    vec3 gcol = mix(vec3(0.38, 0.90, 0.42), vec3(0.70, 1.0, 0.72), exp(-pow(r / 0.10, 2.0)) * 0.40);
    // 品红环：环形分布 + 星云扰动，内侧偏品红、外侧偏紫
    float mh = exp(-pow((r - 0.50) / 0.24, 2.0)) * (0.55 + 0.75 * neb);
    vec3 mcol = mix(vec3(1.0, 0.25, 0.62), vec3(0.66, 0.30, 1.0), smoothstep(0.45, 0.9, r + (neb - 0.5) * 0.4));
    // 外层靛紫雾
    float io = exp(-pow(r / 0.95, 2.0)) * 0.20 * (0.4 + neb);
    vec3 icol = vec3(0.40, 0.30, 0.95);

    E += gcol * gc * 0.95 + mcol * mh * (1.05 - gc * 0.6) + icol * io;
    D = max(D, exp(-pow(r / 1.25, 2.0)) * 0.30);                              // 深梅色暗晕，托住发光
  }

  E = 1.0 - exp(-E * 1.6);                                                  // 软 tone-map
  float m = max(E.r, max(E.g, E.b));
  vec3 rgb = E + vec3(0.172, 0.078, 0.161) * D * 0.35 * (1.0 - m);
  float alpha = clamp(max(m, D), 0.0, 1.0);
  rgb += (hash(p + fract(t)) - 0.5) / 255.0;                                 // 抖动去色带
  gl_FragColor = vec4(clamp(rgb, 0.0, alpha), alpha);
}`;

export function createGlow(canvas) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr);
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);   // 单个大三角形覆盖全屏
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = n => gl.getUniformLocation(prog, n);
  const U = { res: u('uRes'), corner: u('uCorner'), time: u('uTime'), edge: u('uEdge'), bloom: u('uBloom'), dpr: u('uDpr') };
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  return ({ time, edge, bloom }) => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.res, canvas.width, canvas.height);
    gl.uniform2f(U.corner, canvas.width, 0);                                // GL 坐标原点在左下；晕染圆心就是屏幕右下角尖，从角尖扩出、缩回角尖
    gl.uniform1f(U.time, time); gl.uniform1f(U.edge, edge); gl.uniform1f(U.bloom, bloom); gl.uniform1f(U.dpr, dpr);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}
