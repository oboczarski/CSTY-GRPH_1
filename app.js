/**
 * Weekly fantasy points chart + HUD progress circles
 * - HUD circle logic preserved from the original build
 * - Chart markup + rendering mirrors the reference single-chart app
 */

// DATA: Weekly fantasy points for each week (9 weeks total)
// This array controls the data points shown on the chart
const WEEKLY_DATA = [
  { week: 1, pts: 27.9 },
  { week: 2, pts: 18.8 },
  { week: 3, pts: 15.6 },
  { week: 4, pts: 14.5 },
  { week: 5, pts: 15.6 },
  { week: 6, pts: 18.8 },
  { week: 7, pts: 29.9 },
  { week: 8, pts: 26.3 },
  { week: 9, pts: 28.7 }
];

// CHART CONFIGURATION: Maximum points value for the Y-axis scale
const MAX_POINTS = 40;

// DOM ELEMENTS: Get references to chart container and all chart layers
const chartBox = document.getElementById("weekly-chart-box"); // Main chart container
const pointsLayer = document.getElementById("weekly-chart-points"); // Layer where points and curve are drawn
const xAxisEl = document.getElementById("weekly-chart-x-axis"); // Bottom axis showing week labels
const yAxisEl = document.getElementById("weekly-chart-y-axis"); // Left axis showing point values
let curveSvg = null; // SVG element for the connecting curve between points

// ZONE CREATION: Creates the three colored background zones (Under/Solid/Elite)
// These are the gradient bands that show performance categories
function createZones() {
  if (!chartBox) return;
  
  // ZONE THRESHOLDS: Define the three performance zones with their point ranges
  // Under: 0-15.9 pts, Solid: 16-21.9 pts, Elite: 22-40 pts
  const stops = [
    { className: "weekly-zone--bad", label: "Under", to: 15.9 },
    { className: "weekly-zone--good", label: "Solid", to: 21.9 },
    { className: "weekly-zone--great", label: "Elite", to: MAX_POINTS }
  ];

  let prev = 0;
  
  // Loop through each zone and create a div with gradient background and label
  stops.forEach((zone) => {
    // Calculate zone height as percentage of chart height
    const pct = (zone.to / MAX_POINTS) * 100;
    
    // Create zone div and position it
    const zoneEl = document.createElement("div");
    zoneEl.className = `weekly-zone ${zone.className}`;
    zoneEl.style.top = `calc(${100 - pct}% - 1px)`; // Position from top (inverted)
    zoneEl.style.height = `calc(${pct - prev}%)`; // Height based on point range

    // Add zone label (Under/Solid/Elite) in top-right corner
    const label = document.createElement("span");
    label.className = "weekly-zone-label";
    label.textContent = zone.label;
    zoneEl.appendChild(label);

    chartBox.appendChild(zoneEl);
    prev = pct; // Track previous height for next zone
  });
}

// Y-AXIS CONVERSION: Converts fantasy points to Y-position percentage
// Higher points = lower Y position (0% at top = 40pts, 100% at bottom = 0pts)
function yFromPoints(pts) {
  // Clamp points between 0 and MAX_POINTS to keep them within chart bounds
  const clamped = Math.max(0, Math.min(pts, MAX_POINTS));
  // Invert: 40pts = 0% (top), 0pts = 100% (bottom)
  return (1 - clamped / MAX_POINTS) * 100;
}

// POINT CATEGORIZATION: Determines color and glow effect for each data point
// Returns the performance bucket (Elite/Solid/Under) with styling properties
function bucketFor(pts) {
  // Elite performance: 22+ points → Purple
  if (pts >= 22) {
    return { name: "Elite", color: "#cf78ff", glow: "0 0 30px rgba(207, 120, 255, 0.95)" };
  }
  // Solid performance: 16-21.9 points → Cyan
  if (pts >= 16) {
    return { name: "Solid", color: "#00bfff", glow: "0 0 26px rgba(0, 191, 255, 0.9)" };
  }
  // Under performance: 0-15.9 points → Red/Pink
  return { name: "Under", color: "#ff5f6d", glow: "0 0 18px rgba(255, 95, 109, 0.8)" };
}

// X-AXIS RENDERING: Creates the bottom axis with week labels (WK 1, WK 2, etc.)
function renderXAxis() {
  if (!xAxisEl) return;
  xAxisEl.innerHTML = ""; // Clear existing labels
  
  // Create a span for each week in the data
  WEEKLY_DATA.forEach((entry) => {
    const span = document.createElement("span");
    span.textContent = `WK ${entry.week}`;
    xAxisEl.appendChild(span);
  });
}

// Y-AXIS RENDERING: Creates the left axis with point value labels
// Shows the key thresholds: 40 (max), 22 (elite cutoff), 16 (solid cutoff), 0 (min)
function renderYAxis() {
  if (!yAxisEl) return;
  yAxisEl.innerHTML = ""; // Clear existing ticks
  
  // Create tick marks for the four key point values
  [40, 22, 16, 0].forEach((tick) => {
    const tickEl = document.createElement("div");
    tickEl.className = "weekly-chart-y-tick";
    tickEl.textContent = `${tick} fpts`;
    yAxisEl.appendChild(tickEl);
  });
}

// POINT RENDERING: Creates and positions all data points on the chart
// Also generates the hover labels and connects points with a curve
function renderPoints() {
  if (!pointsLayer) return;
  pointsLayer.innerHTML = ""; // Clear existing points

  const n = WEEKLY_DATA.length;
  const curvePoints = []; // Store coordinates for drawing the connecting curve

  // Create a point element for each week's data
  WEEKLY_DATA.forEach((entry, index) => {
    // Calculate X position: center point in its week column
    const pctX = ((index + 0.5) / n) * 100;
    // Calculate Y position based on fantasy points
    const pctY = yFromPoints(entry.pts);
    curvePoints.push({ x: pctX, y: pctY }); // Save for curve drawing

    // Get color and glow based on performance tier
    const bucket = bucketFor(entry.pts);
    
    // Create the circular point element
    const pointEl = document.createElement("div");
    pointEl.className = "weekly-point";
    pointEl.style.left = `calc(${pctX}% - 6px)`; // Center horizontally (-6px = half of 12px width)
    pointEl.style.top = `calc(${pctY}% - 6px)`; // Center vertically (-6px = half of 12px height)
    pointEl.style.background = bucket.color; // Set point color based on performance
    pointEl.style.boxShadow = bucket.glow; // Add glowing effect

    // Create hover label showing week, points, and performance category
    const label = document.createElement("div");
    label.className = "weekly-point-label";
    label.innerHTML = `
      <span class="weekly-point-label__week">WK ${entry.week}</span>
      <span class="weekly-point-label__value">${entry.pts.toFixed(1)} fpts</span>
      <span class="weekly-point-label__bucket">${bucket.name}</span>
    `;
    pointEl.appendChild(label);
    pointsLayer.appendChild(pointEl);
  });

  // Draw the smooth curve connecting all points
  drawCurve(curvePoints);
}

// CURVE DRAWING: Creates smooth Bezier curve connecting all data points
// Uses SVG path with cubic Bezier curves for smooth transitions
function drawCurve(points) {
  if (!pointsLayer || !points.length) return;

  // Get actual pixel dimensions of the chart area
  const box = pointsLayer.getBoundingClientRect();
  const width = box.width;
  const height = box.height;

  // Create SVG element if it doesn't exist yet
  if (!curveSvg) {
    curveSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    curveSvg.setAttribute("class", "weekly-curve-layer");
    curveSvg.style.position = "absolute";
    curveSvg.style.inset = "0"; // Cover entire points layer
    pointsLayer.prepend(curveSvg); // Add behind points
  }

  // Set SVG dimensions to match chart area
  curveSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  curveSvg.setAttribute("width", width);
  curveSvg.setAttribute("height", height);

  // Convert percentage coordinates to absolute pixel coordinates
  const toXY = (point) => ({
    x: (point.x / 100) * width,
    y: (point.y / 100) * height
  });

  const absPoints = points.map(toXY);
  
  // Start path at first point
  let d = `M ${absPoints[0].x} ${absPoints[0].y}`;

  // Create smooth curve between each pair of points using cubic Bezier curves
  for (let i = 0; i < absPoints.length - 1; i += 1) {
    const p0 = absPoints[i];
    const p1 = absPoints[i + 1];
    
    // Calculate control points for smooth curve (35% of distance between points)
    const dx = (p1.x - p0.x) * 0.35;
    const c1x = p0.x + dx; // First control point
    const c1y = p0.y;
    const c2x = p1.x - dx; // Second control point
    const c2y = p1.y;
    
    // Add cubic Bezier curve segment
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p1.x} ${p1.y}`;
  }

  // Create the main curve path (narrow, purple, visible)
  const pathCore = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathCore.setAttribute("d", d);
  pathCore.setAttribute("fill", "none");
  pathCore.setAttribute("stroke", "rgba(207, 120, 255, 0.7)"); // Purple stroke
  pathCore.setAttribute("stroke-width", "2.6");
  pathCore.setAttribute("stroke-linecap", "round");
  pathCore.setAttribute("stroke-linejoin", "round");

  // Create glow effect (wider, transparent purple behind main curve)
  const pathGlow = pathCore.cloneNode(true);
  pathGlow.setAttribute("stroke", "rgba(207, 120, 255, 0.15)"); // Transparent purple
  pathGlow.setAttribute("stroke-width", "8"); // Thicker for glow effect

  // Add both paths to SVG (glow first, then core on top)
  curveSvg.innerHTML = "";
  curveSvg.appendChild(pathGlow);
  curveSvg.appendChild(pathCore);
}

// CHART ORCHESTRATION: Main function that renders the entire weekly chart
// Coordinates all rendering functions in the correct order
function renderWeeklyChart() {
  if (!chartBox || !pointsLayer || !xAxisEl || !yAxisEl) return;

  // Clean up any existing zones from previous render
  chartBox.querySelectorAll(".weekly-zone").forEach((zone) => zone.remove());
  curveSvg = null; // Reset curve SVG

  // Render all chart components in order
  createZones();    // 1. Background performance zones
  renderYAxis();    // 2. Left axis with point values
  renderXAxis();    // 3. Bottom axis with week labels
  renderPoints();   // 4. Data points, labels, and connecting curve
}

/* ========================================
   HUD PROGRESS CIRCLES
   Controls the two circular progress indicators at top of page:
   - Left circle: Consistency percentage
   - Right circle: Ceiling positional rank
   ======================================== */

// PROGRESS DATA: Stats for the two HUD circles
const PROGRESS_CONFIG = {
  ceilingRankMax: 20,           // Total number of positions (rank 1-20)
  consistencyPercent: 66.7,     // Left circle: Consistency rate percentage
  ceilingRank: 4                // Right circle: Current ceiling rank (lower is better)
};

// UTILITY: Clamps a value between min and max bounds
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// PROGRESS CIRCLE HYDRATION: Updates the SVG circles with actual data values
// Sets CSS custom property --progress to control how much of the circle is filled
function hydrateProgressCircles() {
  // LEFT CIRCLE: Consistency percentage (straightforward percentage)
  const consistencyCircle = document.querySelector(
    ".progress-circle--consistency .progress-ring-fill"
  );
  if (consistencyCircle) {
    // Convert 66.7% to 0.667 for CSS variable
    consistencyCircle.style.setProperty(
      "--progress",
      (PROGRESS_CONFIG.consistencyPercent / 100).toFixed(3)
    );
  }

  // RIGHT CIRCLE: Ceiling rank (inverted: lower rank = more filled)
  const ceilingCircle = document.querySelector(
    ".progress-circle--ceiling .progress-ring-fill--ceiling"
  );
  if (ceilingCircle) {
    const rank = PROGRESS_CONFIG.ceilingRank;
    
    // Normalize rank to 0-1 scale (rank 1 = 100% filled, rank 20 = 0% filled)
    // Formula: (maxRank - currentRank) / (maxRank - 1)
    // Example: (20 - 4) / (20 - 1) = 16/19 = 0.842 (84.2% filled)
    const normalized = clamp(
      (PROGRESS_CONFIG.ceilingRankMax - rank) /
        (PROGRESS_CONFIG.ceilingRankMax - 1),
      0,
      1
    );
    ceilingCircle.style.setProperty("--progress", normalized.toFixed(3));
  }
}

// INITIALIZATION: Sets up the entire page when it loads
// Runs all setup functions and attaches event listeners
function init() {
  hydrateProgressCircles(); // Update HUD circles with data
  renderWeeklyChart();       // Draw the weekly points chart
  
  // Re-render chart when window is resized to maintain proper dimensions
  window.addEventListener("resize", renderWeeklyChart);
}

// Run initialization when page is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init(); // Page already loaded, run immediately
}
