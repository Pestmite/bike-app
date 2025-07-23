const miToFt = 5280;
const kmToM = 1000;

export function distanceRound(num, metric = true) {
  const intDigits = Math.floor(Math.log10(Math.abs(num) || 1)) + 1;
  const decimals = Math.max(0, 3 - intDigits);
  const factor = Math.pow(10, decimals);
  const distance = Math.round((Math.round(num * factor) / factor) * 100) / 100
  if (metric) {
    return distance >= 1 ? distance + ' km' : Math.round(num  * kmToM) + ' m';
  } else {
    return distance >= 1 ? distance + ' mi' : Math.round(num * miToFt) + ' ft';
  }
}

export function formatTime(min) {
  return Math.floor(min / 60) == 0 ? Math.floor(min % 60) + " min" : Math.floor(min / 60) + "h " + Math.floor(min % 60) + "min";
}