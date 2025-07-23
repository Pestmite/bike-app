export function distanceRound(num) {
  const intDigits = Math.floor(Math.log10(Math.abs(num) || 1)) + 1;
  const decimals = Math.max(0, 2 - intDigits);
  const factor = Math.pow(10, decimals);
  return Math.round((Math.round(num * factor) / factor) * 100) / 100;
}

export function formatTime(min) {
  return Math.floor(min / 60) == 0 ? Math.floor(min % 60) + " min" : Math.floor(min / 60) + "h " + Math.floor(min % 60) + "min";
}