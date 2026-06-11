export function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

export function formatTemperature(value) {
  return `${Number(value).toFixed(1)}°C`;
}

export function formatHumidity(value) {
  return `${Math.round(value)}%`;
}

export function formatScore(value) {
  return `${Math.round(value)}`;
}

export function formatUpdatedTime(timestamp) {
  if (!timestamp) return '--:--:--';
  const date = timestamp > 10000000000 ? new Date(timestamp) : new Date(timestamp * 1000);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

