/**
 * Liquid Glass Consistency Map — SVG Chart
 * Deterministic, static, single render.
 * This file:
 * - Keeps existing HUD / progress circles behavior.
 * - Completely replaces the main chart inside the chart canvas area with a new SVG-based system.
 * - Uses no randomness, no time-based logic, no animations.
 */

const CHART_CONFIG = {
  width: 1200,
  height: 420,
  padding: {
    top: 54,
    right: 72,
    bottom: 70,
    left: 78
  },
  fontFamily: `"SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
  xDomain: [0, 100],
  yDomain: [0, 100],
  xTicks: [
    { value: 0, label: "Phase 1" },
    { value: 20, label: "Phase 2" },
    { value: 40, label: "Phase 3" },
    { value: 60, label: "Phase 4" },
    { value: 80, label: "Phase 5" },
    { value: 100, label: "Phase 6" }
  ],
  yTicks: [
    { value: 0, label: "0" },
    { value: 20, label: "20" },
    { value: 40, label: "40" },
    { value: 60, label: "60" },
    { value: 80, label: "80" },
    { value: 100, label: "100" }
  ],
  hitRadius: 18,
  tooltipWidthFallback: 148
};

const CONSISTENCY_POINTS = [
  { xLabel: "Phase 1", x: 0, y: 32 },
  { xLabel: "Phase 2", x: 16, y: 40 },
  { xLabel: "Phase 3", x: 32, y: 52 },
  { xLabel: "Phase 4", x: 48, y: 63 },
  { xLabel: "Phase 5", x: 64, y: 74 },
  { xLabel: "Phase 6", x: 80, y: 82 },
  { xLabel: "Phase 7", x: 92, y: 90 },
  { xLabel: "Phase 8", x: 100, y: 88 }
];

const KEY_POINTS = [
  {
    xLabel: "Phase 4",
    title: "Stability Threshold",
    valueLabel: "63%",
    description: "Curve locks into stable liquid band."
  },
  {
    xLabel: "Phase 7",
    title: "Optimal Consistency",
    valueLabel: "90%",
    description: "Peak control in liquid glass state."
  }
];

const CHART_COLORS = {
  bgOuterTop: "#02030a",
  bgOuterBottom: "#040712",
  gridMajor: "rgba(170, 208, 255, 0.14)",
  gridMinor: "rgba(120, 164, 234, 0.06)",
  axis: "rgba(160, 206, 255, 0.96)",
  axisAccent: "#7cf5ff",
  labels: "rgba(170, 190, 240, 0.92)",
  labelsSubtle: "rgba(132, 154, 210, 0.82)",
  areaTop: "rgba(124, 245, 255, 0.22)",
  areaMid: "rgba(45, 92, 140, 0.34)",
  areaBottom: "rgba(3, 7, 18, 0.0)",
  lineCore: "#7cf5ff",
  lineHalo: "rgba(124, 245, 255, 0.55)",
  nodeCore: "#040913",
  nodeRing: "#7cf5ff",
  nodeInner: "#c3f7ff",
  keyNodeRing: "#ffb47e",
  keyNodeInner: "#ffe2b3",
  tooltipBorder: "rgba(146, 199, 255, 0.9)",
  tooltipBg: "rgba(5, 10, 20, 0.98)"
};

/* DOM REFS */

const tooltipEl = document.getElementById("chart-tooltip");
const tooltipWeekEl = document.getElementById("tooltip-week");
const tooltipValueEl = document.getElementById("tooltip-value");
const tooltipZoneEl = document.getElementById("tooltip-zone");

/**
 * Resolve or create the dedicated SVG chart host.
 * - Preserves the original <canvas id="infographicCanvas"> element.
 * - Inserts a sibling host directly after the canvas inside the same parent.
 */
function getChartHost() {
  const canvas = document.getElementById("infographicCanvas");
  if (!canvas) return null;

  // Reuse existing host if already created
  let host = document.getElementById("liquid-glass-chart-host");
  if (host) return host;

  // Create a dedicated host directly after the canvas inside the same parent
  host = document.createElement("div");
  host.id = "liquid-glass-chart-host";
  host.className = "liquid-glass-chart-host";
  host.setAttribute("aria-hidden", "false");

  // Insert right after the canvas without altering any other markup
  if (canvas.parentNode) {
    canvas.parentNode.insertBefore(host, canvas.nextSibling);
  }

  return host;
}


/* STATE */

let svgElement = null;
let layout = null; // { innerWidth, innerHeight, originX, originY, points }

/* UTILITIES */

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function mapX(value) {
  const [d0, d1] = CHART_CONFIG.xDomain;
  const t = (value - d0) / (d1 - d0);
  return layout.originX + t * layout.innerWidth;
}

function mapY(value) {
  const [d0, d1] = CHART_CONFIG.yDomain;
  const t = (value - d0) / (d1 - d0);
  return layout.originY + layout.innerHeight - t * layout.innerHeight;
}

/* PROGRESS CIRCLES HYDRATION
 * Kept as-is to preserve HUD behavior (independent of chart).
 */

const PROGRESS_CONFIG = {
  ceilingRankMax: 20,
  consistencyPercent: 66.7,
  ceilingRank: 4
};

function hydrateProgressCircles() {
  const consistencyCircle = document.querySelector(
    ".progress-circle--consistency .progress-ring-fill"
  );
  if (consistencyCircle) {
    consistencyCircle.style.setProperty(
      "--progress",
      (PROGRESS_CONFIG.consistencyPercent / 100).toFixed(3)
    );
  }

  const ceilingCircle = document.querySelector(
    ".progress-circle--ceiling .progress-ring-fill--ceiling"
  );
  if (ceilingCircle) {
    const rank = PROGRESS_CONFIG.ceilingRank;
    const normalized = clamp(
      (PROGRESS_CONFIG.ceilingRankMax - rank) /
        (PROGRESS_CONFIG.ceilingRankMax - 1),
      0,
      1
    );
    ceilingCircle.style.setProperty("--progress", normalized.toFixed(3));
  }
}

/* LAYOUT + POINTS */

function computeLayout(width, height) {
  const pad = CHART_CONFIG.padding;

  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;

  const mappedPoints = CONSISTENCY_POINTS.map((pt) => ({
    ...pt,
    svgX: mapLinear(pt.x, CHART_CONFIG.xDomain, [
      pad.left,
      pad.left + innerWidth
    ]),
    svgY: mapLinear(pt.y, CHART_CONFIG.yDomain, [
      pad.top + innerHeight,
      pad.top
    ])
  }));

  return {
    width,
    height,
    originX: pad.left,
    originY: pad.top,
    innerWidth,
    innerHeight,
    points: mappedPoints
  };
}

function mapLinear(value, domain, range) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const t = (value - d0) / (d1 - d0);
  return r0 + t * (r1 - r0);
}


/* SVG BUILDERS */

function createSvgElement(name, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.keys(attrs).forEach((key) => {
    if (attrs[key] !== undefined && attrs[key] !== null) {
      el.setAttribute(key, String(attrs[key]));
    }
  });
  return el;
}

function buildDefs(svg) {
  const defs = createSvgElement("defs");

  // Area gradient
  const areaGradient = createSvgElement("linearGradient", {
    id: "lg-area-fill",
    x1: "0%",
    y1: "0%",
    x2: "0%",
    y2: "100%"
  });
  areaGradient.appendChild(
    createSvgElement("stop", {
      offset: "0%",
      "stop-color": CHART_COLORS.areaTop
    })
  );
  areaGradient.appendChild(
    createSvgElement("stop", {
      offset: "55%",
      "stop-color": CHART_COLORS.areaMid
    })
  );
  areaGradient.appendChild(
    createSvgElement("stop", {
      offset: "100%",
      "stop-color": CHART_COLORS.areaBottom
    })
  );
  defs.appendChild(areaGradient);

  // Line halo gradient
  const haloGradient = createSvgElement("linearGradient", {
    id: "lg-line-halo",
    x1: "0%",
    y1: "0%",
    x2: "100%",
    y2: "0%"
  });
  haloGradient.appendChild(
    createSvgElement("stop", {
      offset: "0%",
      "stop-color": CHART_COLORS.lineHalo
    })
  );
  haloGradient.appendChild(
    createSvgElement("stop", {
      offset: "40%",
      "stop-color": CHART_COLORS.lineHalo
    })
  );
  haloGradient.appendChild(
    createSvgElement("stop", {
      offset: "100%",
      "stop-color": CHART_COLORS.lineHalo
    })
  );
  defs.appendChild(haloGradient);

  // Line core gradient
  const lineGradient = createSvgElement("linearGradient", {
    id: "lg-line-core",
    x1: "0%",
    y1: "0%",
    x2: "100%",
    y2: "0%"
  });
  lineGradient.appendChild(
    createSvgElement("stop", {
      offset: "0%",
      "stop-color": CHART_COLORS.lineCore
    })
  );
  lineGradient.appendChild(
    createSvgElement("stop", {
      offset: "100%",
      "stop-color": CHART_COLORS.lineCore
    })
  );
  defs.appendChild(lineGradient);

  // Node glow filter
  const nodeGlow = createSvgElement("filter", {
    id: "lg-node-glow",
    x: "-40%",
    y: "-40%",
    width: "180%",
    height: "180%"
  });
  nodeGlow.appendChild(
    createSvgElement("feDropShadow", {
      dx: "0",
      dy: "0",
      stdDeviation: "2.1",
      "flood-color": CHART_COLORS.lineHalo,
      "flood-opacity": "0.9"
    })
  );
  defs.appendChild(nodeGlow);

  // Line glow filter
  const lineGlow = createSvgElement("filter", {
    id: "lg-line-glow",
    x: "-10%",
    y: "-40%",
    width: "120%",
    height: "180%"
  });
  lineGlow.appendChild(
    createSvgElement("feGaussianBlur", {
      in: "SourceGraphic",
      stdDeviation: "2.2",
      result: "blur"
    })
  );
  lineGlow.appendChild(
    createSvgElement("feColorMatrix", {
      in: "blur",
      type: "matrix",
      values:
        "0 0 0 0 0.6  0 0 0 0 0.96  0 0 0 0 1  0 0 0 0.9 0",
      result: "glow"
    })
  );
  lineGlow.appendChild(
    createSvgElement("feMerge", {})
  );
  const mergeNode1 = createSvgElement("feMergeNode", { in: "glow" });
  const mergeNode2 = createSvgElement("feMergeNode", { in: "SourceGraphic" });
  lineGlow.lastChild.appendChild(mergeNode1);
  lineGlow.lastChild.appendChild(mergeNode2);
  defs.appendChild(lineGlow);

  svg.appendChild(defs);
}

function buildGrid(group) {
  const { originX, originY, innerWidth, innerHeight } = layout;

  // Vertical grid lines (major at xTicks, with subtle inner glow)
  CHART_CONFIG.xTicks.forEach((tick, index) => {
    const x = mapLinear(tick.value, CHART_CONFIG.xDomain, [
      originX,
      originX + innerWidth
    ]);
    const major = index === 0 || index === CHART_CONFIG.xTicks.length - 1 || index % 2 === 0;

    const line = createSvgElement("line", {
      x1: x,
      y1: originY,
      x2: x,
      y2: originY + innerHeight,
      class: major
        ? "lg-grid-line lg-grid-line--v lg-grid-line--major"
        : "lg-grid-line lg-grid-line--v lg-grid-line--minor"
    });
    group.appendChild(line);
  });

  // Horizontal grid lines (major at labeled ticks, minor intermediates)
  CHART_CONFIG.yTicks.forEach((tick, index) => {
    const y = mapLinear(tick.value, CHART_CONFIG.yDomain, [
      originY + innerHeight,
      originY
    ]);
    const major = index === 0 || index === CHART_CONFIG.yTicks.length - 1 || index % 2 === 0;

    const line = createSvgElement("line", {
      x1: originX,
      y1: y,
      x2: originX + innerWidth,
      y2: y,
      class: major
        ? "lg-grid-line lg-grid-line--h lg-grid-line--major"
        : "lg-grid-line lg-grid-line--h lg-grid-line--minor"
    });
    group.appendChild(line);
  });
}

function buildAxes(group) {
  const { originX, originY, innerWidth, innerHeight } = layout;

  // Y-axis line
  const yAxis = createSvgElement("line", {
    x1: originX,
    y1: originY,
    x2: originX,
    y2: originY + innerHeight,
    class: "lg-axis lg-axis--y"
  });
  group.appendChild(yAxis);

  // X-axis line
  const xAxis = createSvgElement("line", {
    x1: originX,
    y1: originY + innerHeight,
    x2: originX + innerWidth,
    y2: originY + innerHeight,
    class: "lg-axis lg-axis--x"
  });
  group.appendChild(xAxis);

  // Y-axis ticks + labels
  CHART_CONFIG.yTicks.forEach((tick) => {
    const y = mapLinear(tick.value, CHART_CONFIG.yDomain, [
      originY + innerHeight,
      originY
    ]);

    const tickLine = createSvgElement("line", {
      x1: originX - 6,
      y1: y,
      x2: originX,
      y2: y,
      class: "lg-axis-tick lg-axis-tick--y"
    });
    group.appendChild(tickLine);

    const label = createSvgElement("text", {
      x: originX - 10,
      y,
      class: "lg-axis-label lg-axis-label--y"
    });
    label.textContent = tick.label;
    group.appendChild(label);
  });

  // Y-axis title
  const yTitle = createSvgElement("text", {
    x: originX - 42,
    y: originY + innerHeight / 2,
    class: "lg-axis-title lg-axis-title--y",
    transform:
      "rotate(-90 " +
      (originX - 42) +
      " " +
      (originY + innerHeight / 2) +
      ")"
  });
  yTitle.textContent = "Consistency Index";
  group.appendChild(yTitle);

  // X-axis ticks + labels
  CHART_CONFIG.xTicks.forEach((tick) => {
    const x = mapLinear(tick.value, CHART_CONFIG.xDomain, [
      originX,
      originX + innerWidth
    ]);

    const tickLine = createSvgElement("line", {
      x1: x,
      y1: originY + innerHeight,
      x2: x,
      y2: originY + innerHeight + 5,
      class: "lg-axis-tick lg-axis-tick--x"
    });
    group.appendChild(tickLine);

    const label = createSvgElement("text", {
      x,
      y: originY + innerHeight + 16,
      class: "lg-axis-label lg-axis-label--x"
    });
    label.textContent = tick.label;
    group.appendChild(label);
  });

  // X-axis title
  const xTitle = createSvgElement("text", {
    x: originX + innerWidth / 2,
    y: originY + innerHeight + 38,
    class: "lg-axis-title lg-axis-title--x"
  });
  xTitle.textContent = "Liquid Glass Calibration Phases";
  group.appendChild(xTitle);

  // Chart title + subtitle (inside chart, aligned top-left)
  const title = createSvgElement("text", {
    x: originX,
    y: originY - 18,
    class: "lg-chart-title"
  });
  title.textContent = "Liquid Glass Consistency Map";
  group.appendChild(title);

  const subtitle = createSvgElement("text", {
    x: originX,
    y: originY - 4,
    class: "lg-chart-subtitle"
  });
  subtitle.textContent = "Static stability surface across calibration phases";
  group.appendChild(subtitle);
}

function buildSmoothPath(points) {
  if (!points.length) return "";

  if (points.length === 1) {
    const p = points[0];
    return `M ${p.svgX},${p.svgY}`;
  }

  if (points.length === 2) {
    const p0 = points[0];
    const p1 = points[1];
    return `M ${p0.svgX},${p0.svgY} L ${p1.svgX},${p1.svgY}`;
  }

  const tension = 0.18;
  let d = `M ${points[0].svgX},${points[0].svgY}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.svgX + (p2.svgX - p0.svgX) * tension;
    const cp1y = p1.svgY + (p2.svgY - p0.svgY) * tension;
    const cp2x = p2.svgX - (p3.svgX - p1.svgX) * tension;
    const cp2y = p2.svgY - (p3.svgY - p1.svgY) * tension;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.svgX},${p2.svgY}`;
  }

  return d;
}

function buildAreaPath(points) {
  if (!points.length) return "";

  const first = points[0];
  const last = points[points.length - 1];

  let d = buildSmoothPath(points);
  d += ` L ${last.svgX},${layout.originY + layout.innerHeight}`;
  d += ` L ${first.svgX},${layout.originY + layout.innerHeight} Z`;
  return d;
}




function buildNodes(group) {
  const { innerHeight, originY } = layout;

  CONSISTENCY_POINTS.forEach((pt) => {
    const mapped = layout.points.find((p) => p.xLabel === pt.xLabel);
    const rOuter = 6.2;
    const rCore = 3.1;

    const keyMeta = KEY_POINTS.find((k) => k.xLabel === pt.xLabel);
    const ringColor = keyMeta
      ? CHART_COLORS.keyNodeRing
      : CHART_COLORS.nodeRing;
    const innerColor = keyMeta
      ? CHART_COLORS.keyNodeInner
      : CHART_COLORS.nodeInner;

    // Vertical guide
    const guide = createSvgElement("line", {
      x1: mapped.svgX,
      y1: mapped.svgY + rCore + 1.2,
      x2: mapped.svgX,
      y2: originY + innerHeight,
      class: "lg-node-guide"
    });
    group.appendChild(guide);

    // Outer ring
    const outer = createSvgElement("circle", {
      cx: mapped.svgX,
      cy: mapped.svgY,
      r: rOuter,
      class: keyMeta
        ? "lg-node lg-node--key-ring"
        : "lg-node lg-node--ring"
    });
    outer.setAttribute("stroke", ringColor);
    group.appendChild(outer);

    // Core
    const core = createSvgElement("circle", {
      cx: mapped.svgX,
      cy: mapped.svgY,
      r: rCore,
      class: "lg-node lg-node--core"
    });
    core.setAttribute("fill", CHART_COLORS.nodeCore);
    group.appendChild(core);

    // Inner highlight
    const inner = createSvgElement("circle", {
      cx: mapped.svgX,
      cy: mapped.svgY - 0.4,
      r: rCore - 0.8,
      class: "lg-node lg-node--inner"
    });
    inner.setAttribute("fill", innerColor);
    group.appendChild(inner);

    // Phase label under x-axis (concise)
    const phaseLabel = createSvgElement("text", {
      x: mapped.svgX,
      y: originY + innerHeight + 30,
      class: "lg-point-label"
    });
    phaseLabel.textContent = pt.xLabel.replace("Phase ", "P");
    group.appendChild(phaseLabel);
  });
}

function buildKeyPointLabels(group) {
  KEY_POINTS.forEach((meta) => {
    const mapped = layout.points.find((p) => p.xLabel === meta.xLabel);
    if (!mapped) return;

    const anchorY = mapped.svgY - 18;

    const title = createSvgElement("text", {
      x: mapped.svgX,
      y: anchorY,
      class: "lg-key-label-title"
    });
    title.textContent = meta.title;
    group.appendChild(title);

    const value = createSvgElement("text", {
      x: mapped.svgX,
      y: anchorY + 10,
      class: "lg-key-label-value"
    });
    value.textContent = meta.valueLabel;
    group.appendChild(value);

    const desc = createSvgElement("text", {
      x: mapped.svgX,
      y: anchorY + 20,
      class: "lg-key-label-desc"
    });
    desc.textContent = meta.description;
    group.appendChild(desc);
  });
}

/* RENDER */

function renderChartSvg(containerWidth, containerHeight) {
  const width = CHART_CONFIG.width;
  const height = CHART_CONFIG.height;

  layout = computeLayout(width, height);

  const svg = createSvgElement("svg", {
    class: "liquid-glass-chart",
    viewBox: `0 0 ${width} ${height}`,
    preserveAspectRatio: "xMidYMid meet",
    role: "img",
    "aria-label": "Liquid Glass Consistency Map — static stability curve"
  });

  buildDefs(svg);

  const bg = createSvgElement("rect", {
    x: 0,
    y: 0,
    width,
    height,
    class: "lg-bg"
  });
  svg.appendChild(bg);

  const gridGroup = createSvgElement("g", { class: "lg-grid" });
  buildGrid(gridGroup);
  svg.appendChild(gridGroup);

  const axesGroup = createSvgElement("g", { class: "lg-axes" });
  buildAxes(axesGroup);
  svg.appendChild(axesGroup);

  const areaPath = buildAreaPath(layout.points);
  if (areaPath) {
    const area = createSvgElement("path", {
      d: areaPath,
      class: "lg-area"
    });
    svg.appendChild(area);
  }

  const linePath = buildSmoothPath(layout.points);
  if (linePath) {
    const halo = createSvgElement("path", {
      d: linePath,
      class: "lg-line lg-line--halo"
    });
    svg.appendChild(halo);

    const core = createSvgElement("path", {
      d: linePath,
      class: "lg-line lg-line--core"
    });
    svg.appendChild(core);
  }

  const nodesGroup = createSvgElement("g", { class: "lg-nodes" });
  buildNodes(nodesGroup);
  svg.appendChild(nodesGroup);

  const keysGroup = createSvgElement("g", { class: "lg-key-labels" });
  buildKeyPointLabels(keysGroup);
  svg.appendChild(keysGroup);

  return svg;
}

/* INTERACTION: POINT HIT-TEST / TOOLTIP (no animations) */

function findNearestPointSvg(xClient, yClient) {
  if (!svgElement || !layout) return null;

  const rect = svgElement.getBoundingClientRect();
  const xSvg = ((xClient - rect.left) / rect.width) * layout.width;
  const ySvg = ((yClient - rect.top) / rect.height) * layout.height;

  let nearest = null;
  let nearestDist2 = Infinity;
  const radius = CHART_CONFIG.hitRadius;
  const r2 = radius * radius;

  layout.points.forEach((p) => {
    const dx = xSvg - p.svgX;
    const dy = ySvg - p.svgY;
    const d2 = dx * dx + dy * dy;
    if (d2 <= r2 && d2 < nearestDist2) {
      nearest = p;
      nearestDist2 = d2;
    }
  });

  return nearest;
}

function updateTooltip(point) {
  if (!tooltipEl) return;

  if (!point) {
    tooltipEl.hidden = true;
    return;
  }

  tooltipWeekEl.textContent = point.xLabel;
  tooltipValueEl.textContent = `${point.y.toFixed(0)}% index`;
  tooltipZoneEl.textContent = "Liquid stability checkpoint";

  tooltipEl.style.borderColor = CHART_COLORS.tooltipBorder;
  tooltipEl.style.background = CHART_COLORS.tooltipBg;

  const rect = svgElement.getBoundingClientRect();
  const x = (point.svgX / layout.width) * rect.width + rect.left;
  const y = (point.svgY / layout.height) * rect.height + rect.top;

  const tooltipWidth =
    tooltipEl.offsetWidth || CHART_CONFIG.tooltipWidthFallback;
  const half = tooltipWidth / 2;
  const margin = 10;

  let left = x - half;
  if (left < rect.left + margin) left = rect.left + margin;
  if (left + tooltipWidth > rect.right - margin) {
    left = rect.right - margin - tooltipWidth;
  }

  tooltipEl.style.left = `${left + half}px`;
  tooltipEl.style.top = `${y - 18}px`;
  tooltipEl.hidden = false;
}

function handleMouseMove(event) {
  if (!svgElement || !layout) return;
  const point = findNearestPointSvg(event.clientX, event.clientY);
  updateTooltip(point);
}

function handleMouseLeave() {
  updateTooltip(null);
}

/* INIT CHART */

function mountChart() {
  const host = getChartHost();
  if (!host) return;

  // Ensure host has correct class
  host.classList.add("liquid-glass-chart-host");

  // Remove previous SVG if present
  const existingSvg = host.querySelector("svg.liquid-glass-chart");
  if (existingSvg) {
    existingSvg.remove();
  }

  // Render deterministic SVG
  svgElement = renderChartSvg(CHART_CONFIG.width, CHART_CONFIG.height);
  host.appendChild(svgElement);

  // Bind interactions
  svgElement.addEventListener("mousemove", handleMouseMove);
  svgElement.addEventListener("mouseleave", handleMouseLeave);
}

/* INIT */

function init() {
  hydrateProgressCircles();
  mountChart();
  window.addEventListener("resize", () => {
    mountChart();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
