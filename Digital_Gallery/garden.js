/* =========================================================
   garden.js  -  animated background
   Flying butterflies, falling blossoms, swaying flowers,
   and (night theme only) glowing fireflies.
   It reads the theme from <html data-theme="day|night">.
   ========================================================= */
(() => {
  "use strict";

  const canvas = document.getElementById("garden");
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  /* ---------- colours for each theme ---------- */
  const THEMES = {
    day: {
      petals: ["#ffb3c9", "#ff8fb1", "#ffd0dc", "#ffffff", "#ffc8a8", "#e3b5ff"],
      center: "#ffd23f",
      stem: "#5fa36a",
      leaf: "#7cc58a",
      body: "#4a2c3a",
      butterflies: [
        ["#ff9a3c", "#ffd23f"],
        ["#ff5d8f", "#ffb3c9"],
        ["#4dabf7", "#a5d8ff"],
        ["#9775fa", "#d0bfff"]
      ],
      glow: false,
      fireflies: false
    },
    night: {
      petals: ["#c792ff", "#8ec5ff", "#f0b6ff", "#9ff3e0", "#ffffff", "#ffc2ec"],
      center: "#fff3a0",
      stem: "#2f7a62",
      leaf: "#3f9b7c",
      body: "#0e0a24",
      butterflies: [
        ["#4dd0ff", "#8e7dff"],
        ["#ff6ad5", "#c774e8"],
        ["#5ee6c8", "#38b6ff"],
        ["#ffd86b", "#ff8a5c"]
      ],
      glow: true,
      fireflies: true
    }
  };
  const currentPalette = () =>
    THEMES[document.documentElement.dataset.theme === "night" ? "night" : "day"];

  /* ---------- state ---------- */
  let W = 0, H = 0, dpr = 1;
  let butterflies = [], petals = [], flowers = [], flies = [];

  /* ---------- creators ---------- */
  function makeButterfly() {
    return {
      x: rand(0, W), y: rand(0, H * 0.85),
      size: rand(14, 26), speed: rand(0.5, 1.1),
      angle: rand(0, TAU), turn: 0,
      flap: rand(0, TAU), flapSpeed: rand(0.18, 0.3),
      color: Math.floor(rand(0, 4)), t: rand(0, 100)
    };
  }

  function makePetal(initial) {
    return {
      x: rand(0, W), y: initial ? rand(-20, H) : rand(-60, -10),
      r: rand(7, 15), vy: rand(0.35, 0.9),
      sway: rand(0.5, 1.4), swayPhase: rand(0, TAU),
      rot: rand(0, TAU), vr: rand(-0.02, 0.02),
      flip: rand(0, TAU), vf: rand(0.01, 0.03),
      color: Math.floor(rand(0, 6)),
      isFlower: Math.random() < 0.45
    };
  }

  function makeFlowerBed() {
    const n = Math.max(6, Math.round(W / 120));
    const scale = clamp(H / 700, 0.55, 1);
    flowers = [];
    for (let i = 0; i < n; i++) {
      flowers.push({
        x: ((i + rand(0.1, 0.9)) * W) / n,
        h: rand(90, 210) * scale, r: rand(14, 26) * (0.7 + scale * 0.3),
        phase: rand(0, TAU), speed: rand(0.6, 1.1), lean: rand(-18, 18),
        color: Math.floor(rand(0, 6)), petals: Math.floor(rand(5, 9))
      });
    }
  }

  function makeFly() {
    return { x: rand(0, W), y: rand(0, H), r: rand(1.2, 2.6), a: rand(0, TAU), sp: rand(0.1, 0.35), tw: rand(0, TAU) };
  }

  function populate() {
    butterflies = Array.from({ length: clamp(Math.round(W / 230), 3, 8) }, makeButterfly);
    petals = Array.from({ length: clamp(Math.round(W / 42), 14, 36) }, () => makePetal(true));
    flies = Array.from({ length: 28 }, makeFly);
    makeFlowerBed();
  }

  /* ---------- drawing helpers ---------- */
  function drawFlower(x, y, r, rot, count, color, center) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    for (let i = 0; i < count; i++) {
      ctx.save();
      ctx.rotate((i * TAU) / count);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.55, r * 0.34, r * 0.55, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.28)"; // soft highlight on each petal
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.62, r * 0.14, r * 0.34, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = center;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawSinglePetal(r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.bezierCurveTo(r * 0.9, -r * 0.6, r * 0.7, r * 0.7, 0, r);
    ctx.bezierCurveTo(-r * 0.7, r * 0.7, -r * 0.9, -r * 0.6, 0, -r);
    ctx.fill();
  }

  function drawWing(s, c1, c2) {
    const g = ctx.createLinearGradient(0, 0, s * 1.1, 0);
    g.addColorStop(0, c2);
    g.addColorStop(1, c1);
    ctx.fillStyle = g;
    ctx.strokeStyle = "rgba(40,20,40,0.5)";
    ctx.lineWidth = 1;

    // upper wing
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.1);
    ctx.bezierCurveTo(s * 0.3, -s * 1.0, s * 1.3, -s * 1.1, s * 1.15, -s * 0.2);
    ctx.bezierCurveTo(s * 1.0, s * 0.1, s * 0.4, s * 0.1, 0, s * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // lower wing
    ctx.beginPath();
    ctx.moveTo(0, s * 0.05);
    ctx.bezierCurveTo(s * 0.6, 0, s * 0.95, s * 0.5, s * 0.6, s * 0.85);
    ctx.bezierCurveTo(s * 0.3, s * 1.05, 0, s * 0.7, 0, s * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // wing spots
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.beginPath(); ctx.arc(s * 0.75, -s * 0.4, s * 0.1, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.5, s * 0.5, s * 0.07, 0, TAU); ctx.fill();
  }

  function drawButterfly(b, pal) {
    const [c1, c2] = pal.butterflies[b.color % pal.butterflies.length];
    const s = b.size;
    const f = 0.18 + 0.82 * Math.abs(Math.cos(b.flap)); // wing opening: 0.18 (closed) .. 1 (open)

    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle + Math.PI / 2);
    if (pal.glow) { ctx.shadowColor = c1; ctx.shadowBlur = 18; }

    for (const side of [1, -1]) {          // right wings, then mirrored left wings
      ctx.save();
      ctx.scale(side * f, 1);
      drawWing(s, c1, c2);
      ctx.restore();
    }
    ctx.shadowBlur = 0;

    ctx.fillStyle = pal.body;               // body
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.07, s * 0.5, 0, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = pal.body;             // antennae
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.45); ctx.quadraticCurveTo(-s * 0.15, -s * 0.8, -s * 0.3, -s * 0.85);
    ctx.moveTo(0, -s * 0.45); ctx.quadraticCurveTo(s * 0.15, -s * 0.8, s * 0.3, -s * 0.85);
    ctx.stroke();
    ctx.restore();
  }

  function drawStemFlower(f, time, pal) {
    const baseX = f.x, baseY = H + 4;
    const sway = Math.sin(time * f.speed + f.phase) * 10 + f.lean;
    const topX = baseX + sway, topY = baseY - f.h;

    ctx.strokeStyle = pal.stem;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.quadraticCurveTo(baseX + sway * 0.2, baseY - f.h * 0.5, topX, topY);
    ctx.stroke();

    ctx.fillStyle = pal.leaf;               // one leaf at mid-stem
    ctx.beginPath();
    ctx.ellipse(baseX + sway * 0.35 + 10, baseY - f.h * 0.5, 12, 5, -0.6 + sway * 0.01, 0, TAU);
    ctx.fill();

    drawFlower(topX, topY, f.r, sway * 0.02 + f.phase, f.petals,
               pal.petals[f.color % pal.petals.length], pal.center);
  }

  /* ---------- one frame ---------- */
  function render(time, dt) {
    const pal = currentPalette();
    ctx.clearRect(0, 0, W, H);

    // swaying flowers (back layer)
    ctx.globalAlpha = 0.92;
    flowers.forEach(f => drawStemFlower(f, time, pal));
    ctx.globalAlpha = 1;

    // fireflies (night only)
    if (pal.fireflies) {
      flies.forEach(p => {
        p.a += (Math.random() - 0.5) * 0.08 * dt;
        p.x += Math.cos(p.a) * p.sp * dt;
        p.y += Math.sin(p.a) * p.sp * dt;
        p.tw += 0.03 * dt;
        if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
        ctx.globalAlpha = 0.25 + 0.75 * Math.abs(Math.sin(p.tw));
        ctx.shadowColor = "#fff6a8";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#fff6a8";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // falling blossoms and petals
    petals.forEach(p => {
      p.swayPhase += 0.015 * dt;
      p.y += p.vy * dt;
      p.x += Math.sin(p.swayPhase) * p.sway * dt * 0.6;
      p.rot += p.vr * dt;
      p.flip += p.vf * dt;
      if (p.y > H + 30) Object.assign(p, makePetal(false));

      ctx.save();
      ctx.globalAlpha = 0.88;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, 0.45 + 0.55 * Math.abs(Math.cos(p.flip))); // tumbling effect
      const col = pal.petals[p.color % pal.petals.length];
      if (p.isFlower) drawFlower(0, 0, p.r * 1.3, 0, 5, col, pal.center);
      else drawSinglePetal(p.r, col);
      ctx.restore();
    });

    // butterflies (front layer)
    butterflies.forEach(b => {
      b.t += dt * 0.02;
      b.turn = clamp((b.turn + (Math.random() - 0.5) * 0.012 * dt) * 0.96, -0.05, 0.05);
      b.angle += b.turn * dt + Math.sin(b.t * 3) * 0.01 * dt;
      b.x += Math.cos(b.angle) * b.speed * dt * 1.4;
      b.y += Math.sin(b.angle) * b.speed * dt * 1.4 + Math.sin(b.t * 5) * 0.3 * dt;
      b.flap += b.flapSpeed * dt;
      const m = 60;
      if (b.x < -m) b.x = W + m; if (b.x > W + m) b.x = -m;
      if (b.y < -m) b.y = H + m; if (b.y > H + m) b.y = -m;
      drawButterfly(b, pal);
    });
  }

  /* ---------- loop ---------- */
  let raf = 0, last = 0;
  function frame(ts) {
    const dt = Math.min((ts - last) / 16.667, 3);   // 1 = one frame at 60fps
    last = ts;
    render(ts / 1000, dt);
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (reduceMotion || raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  function resize() {
    const oldW = W;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (W !== oldW) populate();                      // ignore tiny mobile-toolbar height changes
    if (reduceMotion) render(0, 0);
  }

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  new MutationObserver(() => { if (reduceMotion) render(0, 0); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  resize();
  start();
})();
