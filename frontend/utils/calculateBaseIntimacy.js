export function getMessageMultiplier(msgCount) {
  if (msgCount >= 27) return 1.0347;
  if (msgCount >= 9) return 1.0282;
  if (msgCount >= 3) return 1.023375;
  return 1.0; // maintenance
}

function curve2(x) { return 1 + 3 * Math.pow(x, 1.8); } // Reserved
function curve3(x) { return 1 + 3 * x; }               // Balanced
function curve4(x) { return 1 + 3 * (3 * x * x - 2 * x * x * x); } // Seductive
function curve5(x) { return 1 + 3 * Math.pow(x, 0.6); } // Nympho

export function calculateBaseIntimacy({ curveType = 3, msgCount = 1, daysSinceStart = 0, pausedDays = 0 }) {
  const multiplier = getMessageMultiplier(msgCount);
  let targetDays = 60;
  if (multiplier === 1.0282) targetDays = 50;
  else if (multiplier === 1.0347) targetDays = 40;

  const adjustedDays = Math.max(0, daysSinceStart - pausedDays);
  const x = Math.min(1, adjustedDays / targetDays);

  let fn = curve3;
  if (curveType === 2) fn = curve2;
  else if (curveType === 4) fn = curve4;
  else if (curveType === 5) fn = curve5;

  const score = fn(x);
  return { score: parseFloat(score.toFixed(2)), rank: Math.min(5, Math.floor(score)) };
}
