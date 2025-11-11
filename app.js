const canvas = document.getElementById("infographicCanvas");
const ctx = canvas.getContext("2d");

const stats = {
  high: document.getElementById("stat-high"),
  highWeek: document.getElementById("stat-high-week"),
  avg: document.getElementById("stat-average"),
  low: document.getElementById("stat-low"),
  lowWeek: document.getElementById("stat-low-week"),
  range: document.getElementById("stat-range")
};

const weeks = [
  { week: "WK1", value: 27.9 },
  { week: "WK2", value: 18.8 },
  { week: "WK3", value: 15.6 },
  { week: "WK4", value: 14.5 },
  { week: "WK5", value: 15.6 },
  { week: "WK6", value: 18.8 },
  { week: "WK7", value: 29.9 },
  { week: "WK8", value: 26.3 },
  { week: "WK9", value: 28.7 }
];

const minVal = 0;
const maxVal = 40;
const padding = { top: 90, right: 90, bottom: 150, left: 120 };
const sparkles = Array.from({ length: 70 }, () => ({
  x: Math.random(),
  y: Math.random(),
  size: 0.5 + Math.random() * 1.3,
  drift: 0.25 + Math.random() * 0.75,
  hue: Math.random() > 0.5 ? "rgba(94, 247, 255, 0.65)" : "rgba(255, 122, 204, 0.5)"
}));

let animationFrame;
let tick = 0;

const formatWeek = (w) => w.replace("WK", "WK ");
const formatPoints = (value) => `${value.toFixed(1)} pts`;

function hydrateStats() {
  const sorted = [...weeks].sort((a, b) => b.value - a.value);
  const high = sorted[0];
  const low = sorted[sorted.length - 1];
  const avg = weeks.reduce((acc, cur) => acc + cur.value, 0) / weeks.length;
  stats.high.textContent = formatPoints(high.value);
  stats.highWeek.textContent = `${formatWeek(high.week)} — crest`;
  stats.low.textContent = formatPoints(low.value);
  stats.lowWeek.textContent = `${formatWeek(low.week)} — trough`;
  stats.avg.textContent = formatPoints(avg);
  stats.range.textContent = formatPoints(high.value - low.value);
}

hydrateStats();

function valueToY(val, rect) {
  const pct = (val - minVal) / (maxVal - minVal);
  return rect.y + rect.h - pct * rect.h;
}

function buildPoints(rect) {
  const usableWidth = rect.w;
  const spacing = usableWidth / (weeks.length - 1);
  return weeks.map((wk, idx) => ({
    ...wk,
    x: rect.x + idx * spacing,
    y: valueToY(wk.value, rect)
  }));
}

function drawRoundedPanel(x, y, width, height, radius = 32) {
  const r = Math.min(radius, height / 2, width / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function paintBackdrop(w, h, time) {
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, "rgba(3, 6, 18, 0.95)");
  gradient.addColorStop(1, "rgba(7, 12, 28, 0.95)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.filter = "blur(120px)";
  ctx.fillStyle = `rgba(118, 255, 248, ${0.12 + 0.05 * Math.sin(time * 0.6)})`;
  ctx.beginPath();
  ctx.ellipse(w * 0.3, h * 0.2, w * 0.35, h * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255, 120, 210, ${0.1 + 0.04 * Math.cos(time * 0.7)})`;
  ctx.beginPath();
  ctx.ellipse(w * 0.75, h * 0.68, w * 0.4, h * 0.25, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGlassBackplate(rect) {
  ctx.save();
  drawRoundedPanel(rect.x - 50, rect.y - 60, rect.w + 100, rect.h + 140, 42);
  const gradient = ctx.createLinearGradient(rect.x, rect.y - 80, rect.x + rect.w, rect.y + rect.h + 140);
  gradient.addColorStop(0, "rgba(12, 16, 32, 0.9)");
  gradient.addColorStop(0.35, "rgba(18, 24, 46, 0.75)");
  gradient.addColorStop(1, "rgba(7, 9, 22, 0.6)");
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = "rgba(118, 156, 255, 0.25)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const sheen = ctx.createLinearGradient(rect.x, rect.y - 60, rect.x, rect.y + rect.h);
  sheen.addColorStop(0, "rgba(255, 255, 255, 0.22)");
  sheen.addColorStop(0.25, "rgba(255, 255, 255, 0.05)");
  sheen.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.clip();
  ctx.fillStyle = sheen;
  ctx.fillRect(rect.x - 50, rect.y - 60, rect.w + 100, rect.h + 140);
  ctx.restore();
}

function drawZoneBands(rect) {
  const eliteTop = rect.y;
  const eliteBottom = valueToY(22, rect);
  const solidBottom = valueToY(16, rect);
  ctx.save();
  ctx.fillStyle = "rgba(91, 230, 255, 0.08)";
  ctx.fillRect(rect.x, eliteTop, rect.w, eliteBottom - eliteTop);
  ctx.fillStyle = "rgba(136, 120, 255, 0.08)";
  ctx.fillRect(rect.x, eliteBottom, rect.w, solidBottom - eliteBottom);
  ctx.fillStyle = "rgba(255, 116, 193, 0.06)";
  ctx.fillRect(rect.x, solidBottom, rect.w, rect.y + rect.h - solidBottom);
  ctx.restore();
}

function drawLiquidWaves(rect, time) {
  const renderWave = (amplitude, phase, color, opacity) => {
    ctx.save();
    ctx.beginPath();
    const baseY = rect.y + rect.h * 0.35;
    const segments = 80;
    for (let i = 0; i <= segments; i++) {
      const pct = i / segments;
      const x = rect.x + pct * rect.w;
      const waveY = baseY + Math.sin(pct * Math.PI * 2 + phase + time * 0.6) * amplitude;
      if (i === 0) ctx.moveTo(x, waveY);
      else ctx.lineTo(x, waveY);
    }
    ctx.lineTo(rect.x + rect.w, rect.y + rect.h + 40);
    ctx.lineTo(rect.x, rect.y + rect.h + 40);
    ctx.closePath();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(${color.join(",")}, ${opacity})`;
    ctx.fill();
    ctx.restore();
  };

  renderWave(rect.h * 0.06, 0, [95, 232, 255], 0.08);
  renderWave(rect.h * 0.08, Math.PI / 2, [255, 128, 214], 0.05);
}

function drawGrid(rect) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 12]);
  for (let v = 0; v <= maxVal; v += 10) {
    const y = valueToY(v, rect);
    ctx.beginPath();
    ctx.moveTo(rect.x, y);
    ctx.lineTo(rect.x + rect.w, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  weeks.forEach((_, idx) => {
    const x = rect.x + (rect.w / (weeks.length - 1)) * idx;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(x, rect.y);
    ctx.lineTo(x, rect.y + rect.h);
    ctx.stroke();
  });
  ctx.restore();
}

function drawSparkles(rect, time) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  sparkles.forEach((sparkle, idx) => {
    const oscillation = Math.sin(time * 0.6 + idx) * 0.02;
    const x = rect.x + (((sparkle.x + oscillation) % 1 + 1) % 1) * rect.w;
    const y = rect.y + (((sparkle.y + time * 0.02 * sparkle.drift) % 1 + 1) % 1) * rect.h;
    const radius = 10 + sparkle.size * 20;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, sparkle.hue);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawColumns(points, rect, time) {
  const columnWidth = Math.min(50, (rect.w / (weeks.length - 1)) * 0.55);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  points.forEach((p, idx) => {
    const x = p.x - columnWidth / 2;
    const baseY = rect.y + rect.h;
    const gradient = ctx.createLinearGradient(x, p.y, x, baseY);
    gradient.addColorStop(0, "rgba(96, 248, 255, 0.25)");
    gradient.addColorStop(0.5, "rgba(90, 126, 255, 0.12)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, p.y, columnWidth, baseY - p.y);

    const offset = Math.sin(time * 1.4 + idx) * 8;
    const highlight = ctx.createLinearGradient(x, p.y - 20, x, baseY);
    highlight.addColorStop(0, "rgba(255, 255, 255, 0.25)");
    highlight.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = highlight;
    ctx.beginPath();
    ctx.moveTo(x, p.y + offset);
    ctx.quadraticCurveTo(p.x, p.y - 50, x + columnWidth, p.y + offset);
    ctx.lineTo(x + columnWidth, baseY);
    ctx.lineTo(x, baseY);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}

function traceCurve(points, close = false, baseY = 0) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    ctx.quadraticCurveTo(current.x, current.y, midX, midY);
  }
  const lastPoint = points[points.length - 1];
  ctx.lineTo(lastPoint.x, lastPoint.y);
  if (close) {
    ctx.lineTo(lastPoint.x, baseY);
    ctx.lineTo(points[0].x, baseY);
    ctx.closePath();
  }
}

function drawArea(points, rect) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  gradient.addColorStop(0, "rgba(107, 251, 255, 0.35)");
  gradient.addColorStop(0.35, "rgba(118, 133, 255, 0.25)");
  gradient.addColorStop(1, "rgba(5, 7, 17, 0)");
  ctx.fillStyle = gradient;
  traceCurve(points, true, rect.y + rect.h);
  ctx.fill();
  ctx.restore();
}

function drawSpline(points) {
  ctx.save();
  ctx.shadowColor = "rgba(95, 248, 255, 0.35)";
  ctx.shadowBlur = 25;
  ctx.lineWidth = 3;
  const lastPoint = points[points.length - 1];
  const gradient = ctx.createLinearGradient(points[0].x, points[0].y, lastPoint.x, lastPoint.y);
  gradient.addColorStop(0, "#5ef3ff");
  gradient.addColorStop(0.5, "#7a7cff");
  gradient.addColorStop(1, "#ff8ace");
  ctx.strokeStyle = gradient;
  traceCurve(points, false, 0);
  ctx.stroke();
  ctx.restore();
}

function zoneVisuals(value) {
  if (value <= 16) {
    return { core: "#ff74c7", glow: "rgba(255, 123, 210, 0.65)", chip: "rgba(255, 116, 193, 0.75)" };
  }
  if (value <= 22) {
    return { core: "#b6a1ff", glow: "rgba(181, 167, 255, 0.6)", chip: "rgba(146, 127, 255, 0.75)" };
  }
  return { core: "#85f8ff", glow: "rgba(133, 248, 255, 0.7)", chip: "rgba(133, 248, 255, 0.85)" };
}

function drawPointDetails(points, rect) {
  points.forEach((p) => {
    const zone = zoneVisuals(p.value);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 32);
    glow.addColorStop(0, zone.glow);
    glow.addColorStop(0.8, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const pulse = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12);
    pulse.addColorStop(0, "#060a15");
    pulse.addColorStop(1, zone.core);
    ctx.fillStyle = pulse;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = "rgba(133, 248, 255, 0.25)";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + 12);
    ctx.lineTo(p.x, rect.y + rect.h);
    ctx.stroke();
    ctx.restore();

    const label = `${p.value.toFixed(1)} pts`;
    ctx.font = "12.4px 'Space Grotesk', system-ui, sans-serif";
    const labelWidth = ctx.measureText(label).width + 32;
    const chipX = Math.min(Math.max(p.x - labelWidth / 2, rect.x + 10), rect.x + rect.w - labelWidth - 10);
    const chipY = p.y - 48;
    const chipHeight = 30;
    ctx.save();
    drawRoundedPanel(chipX, chipY, labelWidth, chipHeight, 14);
    const chipGrad = ctx.createLinearGradient(chipX, chipY, chipX + labelWidth, chipY + chipHeight);
    chipGrad.addColorStop(0, "rgba(6, 7, 18, 0.95)");
    chipGrad.addColorStop(1, "rgba(24, 29, 55, 0.55)");
    ctx.fillStyle = chipGrad;
    ctx.fill();
    ctx.strokeStyle = zone.chip;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.globalCompositeOperation = "screen";
    const chipSheen = ctx.createLinearGradient(chipX, chipY, chipX, chipY + chipHeight);
    chipSheen.addColorStop(0, `${zone.chip}`);
    chipSheen.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = chipSheen;
    drawRoundedPanel(chipX, chipY, labelWidth, chipHeight, 14);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#f7fbff";
    ctx.textBaseline = "middle";
    ctx.fillText(label, chipX + 16, chipY + chipHeight / 2);
  });
}

function drawAxes(rect) {
  ctx.save();
  ctx.strokeStyle = "rgba(133, 160, 255, 0.4)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(rect.x, rect.y - 15);
  ctx.lineTo(rect.x, rect.y + rect.h + 10);
  ctx.lineTo(rect.x + rect.w + 15, rect.y + rect.h + 10);
  ctx.stroke();
  ctx.restore();
}

function drawAxisLabels(rect, points) {
  ctx.font = "12px 'Space Grotesk', system-ui, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  for (let v = 0; v <= maxVal; v += 10) {
    const y = valueToY(v, rect);
    const text = `${v} pts`;
    ctx.fillText(text, rect.x - 70, y);
  }

  ctx.textBaseline = "top";
  points.forEach((p) => {
    const weekLabel = p.week.replace("WK", "WK • ");
    ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
    ctx.fillText(weekLabel, p.x - 26, rect.y + rect.h + 18);
  });

  ctx.save();
  ctx.translate(rect.x - 90, rect.y + rect.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.font = "14px 'Space Grotesk', system-ui, sans-serif";
  ctx.fillText("Fantasy Points", 0, 0);
  ctx.restore();

  ctx.font = "14px 'Space Grotesk', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Week Timeline", rect.x + rect.w / 2, rect.y + rect.h + 50);
}

function draw(time = 0) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  ctx.save();
  paintBackdrop(w, h, time);
  const rect = {
    x: padding.left,
    y: padding.top,
    w: w - padding.left - padding.right,
    h: h - padding.top - padding.bottom
  };
  drawGlassBackplate(rect);
  drawZoneBands(rect);
  drawLiquidWaves(rect, time);
  drawGrid(rect);
  drawSparkles(rect, time);
  const points = buildPoints(rect);
  drawColumns(points, rect, time);
  drawArea(points, rect);
  drawSpline(points);
  drawPointDetails(points, rect);
  drawAxes(rect);
  drawAxisLabels(rect, points);
  ctx.restore();
}

function render() {
  draw(tick);
  tick += 0.01;
  animationFrame = requestAnimationFrame(render);
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * ratio;
  canvas.height = canvas.clientHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function handleResize() {
  resizeCanvas();
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
  render();
}

window.addEventListener("resize", handleResize);
handleResize();
