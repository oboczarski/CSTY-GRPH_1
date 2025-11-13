# Chart Rendering Analysis:

## index.html - HTML Structure

•	Info: Main Chart Container
    •	Line Number: 47
	•	Element/Rule: <div class="weekly-chart-box" id="weekly-chart-box">
	•	What It Does: Main container for the entire chart, holding axes, grid, points layer, and zones.
	•	Styling/Logic Details: Positioned relatively; width 100%; height clamped 320px–420px; border-radius 20px; overflow hidden; radial gradient background (dark blue with cyan/pink accents).

•	Info: Y-Axis Container
    •	Line Number: 48
	•	Element/Rule: <div class="weekly-chart-y-axis" id="weekly-chart-y-axis"></div>
	•	What It Does: Container for y-axis ticks (fantasy points labels).
	•	Styling/Logic Details: Positioned absolutely (top 0, bottom 1.35rem, left 0.35rem); width 3.2rem; linear gradient background; flex column; z-index 3.

•	Info: Grid Background
    •	Line Number: 49
	•	Element/Rule: <div class="weekly-chart-grid" aria-hidden="true"></div>
	•	What It Does: Provides static horizontal grid lines for visual reference.
	•	Styling/Logic Details: Positioned absolutely (inset 0 0 0 3.5rem); linear gradient background-image (transparent to rgba(255, 255, 255, 0.04)); pointer-events none; z-index 1.

•	Info: Points and Curve Layer
    •	Line Number: 50
	•	Element/Rule: <div class="weekly-chart-line-layer" id="weekly-chart-points"></div>
	•	What It Does: Layer for data points and the connecting curve SVG.
	•	Styling/Logic Details: Positioned absolutely (inset 1rem 0.25rem 1.4rem 3.5rem); z-index 4.

•	Info: X-Axis Container
    •	Line Number: 51
	•	Element/Rule: <div class="weekly-chart-x-axis" id="weekly-chart-x-axis"></div>
	•	What It Does: Container for x-axis labels (week numbers).
	•	Styling/Logic Details: Positioned absolutely (bottom 0, left 3.5rem, right 0.3rem); flex row; background rgba(2, 6, 23, 0.85); border-radius 0 0 18px 18px; backdrop-filter blur(10px); z-index 5.

## app.js - JavaScript Logic

•	Info: DATA: Weekly fantasy points for each week (9 weeks total)
    •	Line Number: 7
	•	Element/Rule: const WEEKLY_DATA = [...]
	•	What It Does: This array controls the data points shown on the chart.
	•	Styling/Logic Details: Contains 9 objects with week number and points (pts); used by all rendering functions to create chart elements.

•	Info: CHART CONFIGURATION: Maximum points value for the Y-axis scale
    •	Line Number: 21
	•	Element/Rule: const MAX_POINTS = 40;
	•	What It Does: Sets the maximum y-axis value for scaling calculations.
	•	Styling/Logic Details: Used in yFromPoints(), createZones(), and all percentage-based positioning calculations.

•	Info: DOM ELEMENTS: Main chart container
    •	Line Number: 24
	•	Element/Rule: const chartBox = document.getElementById("weekly-chart-box");
	•	What It Does: References the main chart container element.
	•	Styling/Logic Details: Used for appending zone divs in createZones() and cleanup in renderWeeklyChart().

•	Info: DOM ELEMENTS: Points and curve layer
    •	Line Number: 25
	•	Element/Rule: const pointsLayer = document.getElementById("weekly-chart-points");
	•	What It Does: References the layer where points and curve are drawn.
	•	Styling/Logic Details: Container for all data point divs and the SVG curve element; z-index 4.

•	Info: DOM ELEMENTS: Bottom axis showing week labels
    •	Line Number: 26
	•	Element/Rule: const xAxisEl = document.getElementById("weekly-chart-x-axis");
	•	What It Does: References the x-axis container for week labels.
	•	Styling/Logic Details: Populated by renderXAxis() with spans showing "WK 1", "WK 2", etc.

•	Info: DOM ELEMENTS: Left axis showing point values
    •	Line Number: 27
	•	Element/Rule: const yAxisEl = document.getElementById("weekly-chart-y-axis");
	•	What It Does: References the y-axis container for point value ticks.
	•	Styling/Logic Details: Populated by renderYAxis() with divs showing 40, 22, 16, 0 fpts.

•	Info: DOM ELEMENTS: SVG element for the connecting curve between points
    •	Line Number: 28
	•	Element/Rule: let curveSvg = null;
	•	What It Does: Global variable to hold the SVG curve element; reset on re-render.
	•	Styling/Logic Details: Created in drawCurve() when null; reset to null in renderWeeklyChart() for cleanup.

•	Info: ZONE CREATION: Creates the three colored background zones (Under/Solid/Elite)
    •	Line Number: 31-69
	•	Element/Rule: function createZones()
	•	What It Does: These are the gradient bands that show performance categories.
	•	Styling/Logic Details: ZONE THRESHOLDS - Under: 0-15.9 pts, Solid: 16-21.9 pts, Elite: 22-40 pts. Calculates zone height as percentage, positions from top (inverted), adds labels in top-right corner.

•	Info: Y-AXIS CONVERSION: Converts fantasy points to Y-position percentage
    •	Line Number: 72-77
	•	Element/Rule: function yFromPoints(pts)
	•	What It Does: Higher points = lower Y position (0% at top = 40pts, 100% at bottom = 0pts).
	•	Styling/Logic Details: Clamps points between 0 and MAX_POINTS; returns inverted percentage: (1 - clamped / MAX_POINTS) * 100.

•	Info: POINT CATEGORIZATION: Determines color and glow effect for each data point
    •	Line Number: 80-92
	•	Element/Rule: function bucketFor(pts)
	•	What It Does: Returns the performance bucket (Elite/Solid/Under) with styling properties.
	•	Styling/Logic Details: Elite (22+ pts): purple #cf78ff with strong glow; Solid (16-21.9 pts): cyan #00bfff with medium glow; Under (0-15.9 pts): red/pink #ff5f6d with light glow.

•	Info: X-AXIS RENDERING: Creates the bottom axis with week labels (WK 1, WK 2, etc.)
    •	Line Number: 95-104
	•	Element/Rule: function renderXAxis()
	•	What It Does: Clears and populates x-axis container with week labels.
	•	Styling/Logic Details: Clears innerHTML; creates span for each week in WEEKLY_DATA; appends to xAxisEl.

•	Info: Y-AXIS RENDERING: Creates the left axis with point value labels
    •	Line Number: 107-119
	•	Element/Rule: function renderYAxis()
	•	What It Does: Shows the key thresholds: 40 (max), 22 (elite cutoff), 16 (solid cutoff), 0 (min).
	•	Styling/Logic Details: Clears innerHTML; creates tick divs for [40, 22, 16, 0]; appends to yAxisEl with class "weekly-chart-y-tick".

•	Info: POINT RENDERING: Creates and positions all data points on the chart
    •	Line Number: 123-172
	•	Element/Rule: function renderPoints()
	•	What It Does: Also generates the hover labels and connects points with a curve.
	•	Styling/Logic Details: Calculates X position (centered in week column): ((index + 0.5) / n) * 100; calculates Y position via yFromPoints(); creates circular 12px point with bucket color and glow; adds hover label with week/value/performance; calls drawCurve() with collected coordinates.

•	Info: CURVE DRAWING: Creates smooth Bezier curve connecting all data points
    •	Line Number: 176-239
	•	Element/Rule: function drawCurve(points)
	•	What It Does: Uses SVG path with cubic Bezier curves for smooth transitions.
	•	Styling/Logic Details: Creates SVG if null; sets viewBox to match chart dimensions; converts percentage coords to absolute pixels; builds cubic Bezier path (control points at 35% distance); creates glow path (8px wide, transparent purple) and core path (2.6px wide, solid purple); prepends to pointsLayer behind points.

•	Info: CHART ORCHESTRATION: Main function that renders the entire weekly chart
    •	Line Number: 242-255
	•	Element/Rule: function renderWeeklyChart()
	•	What It Does: Coordinates all rendering functions in the correct order.
	•	Styling/Logic Details: Cleans up existing zones; resets curveSvg to null; calls createZones() → renderYAxis() → renderXAxis() → renderPoints() in sequence.

•	Info: PROGRESS DATA: Stats for the two HUD circles
    •	Line Number: 265-269
	•	Element/Rule: const PROGRESS_CONFIG
	•	What It Does: Controls the circular progress indicators (Left: Consistency %, Right: Ceiling rank).
	•	Styling/Logic Details: ceilingRankMax (20 total positions); consistencyPercent (66.7%); ceilingRank (4, lower is better).

•	Info: UTILITY: Clamps a value between min and max bounds
    •	Line Number: 272-274
	•	Element/Rule: function clamp(value, min, max)
	•	What It Does: Ensures value stays within specified range.
	•	Styling/Logic Details: Returns Math.max(min, Math.min(max, value)).

•	Info: PROGRESS CIRCLE HYDRATION: Updates the SVG circles with actual data values
    •	Line Number: 278-312
	•	Element/Rule: function hydrateProgressCircles()
	•	What It Does: Sets CSS custom property --progress to control how much of the circle is filled.
	•	Styling/Logic Details: LEFT CIRCLE - Converts 66.7% to 0.667 for CSS variable. RIGHT CIRCLE - Normalizes rank to 0-1 scale (inverted: lower rank = more filled); formula: (maxRank - currentRank) / (maxRank - 1); rank 4 = 0.842 (84.2% filled).

•	Info: INITIALIZATION: Sets up the entire page when it loads
    •	Line Number: 316-322
	•	Element/Rule: function init()
	•	What It Does: Runs all setup functions and attaches event listeners.
	•	Styling/Logic Details: Calls hydrateProgressCircles() to update HUD circles; calls renderWeeklyChart() to draw chart; adds resize listener to re-render chart on window resize.

•	Info: DOM READY CHECK: Ensures initialization runs when page is ready
    •	Line Number: 325-329
	•	Element/Rule: if (document.readyState === "loading") ... else init();
	•	What It Does: Standard DOMContentLoaded pattern.
	•	Styling/Logic Details: Waits for DOM if loading, otherwise runs init() immediately.

