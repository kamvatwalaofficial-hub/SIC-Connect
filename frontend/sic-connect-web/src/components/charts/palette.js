// Balanced Samsung-inspired chart palette: Samsung blue, navy, green, orange, yellow, purple, grey.
export const CHART_COLORS = [
  '#1428a0', // Samsung blue
  '#3355f0', // bright blue
  '#16a34a', // green
  '#f59e0b', // orange
  '#eab308', // yellow
  '#7c3aed', // purple
  '#0ea5e9', // sky
  '#ef4444', // red
];

export const SLATE = '#94a3b8';

export function colorAt(i) {
  return CHART_COLORS[i % CHART_COLORS.length];
}
