const scenarios = [
  {
    temp: 24.6,
    humidity: 52,
    motionLevel: 0.18,
    bumpLevel: 0.12,
    comfortScore: 96,
    petStatus: 'calm',
    riskLevel: 'normal',
    message: 'Cabin environment looks comfortable.',
  },
  {
    temp: 31.2,
    humidity: 67,
    motionLevel: 0.42,
    bumpLevel: 0.32,
    comfortScore: 66,
    petStatus: 'active',
    riskLevel: 'warning',
    message: 'Cabin temperature is getting high. Please check ventilation.',
  },
  {
    temp: 35.4,
    humidity: 78,
    motionLevel: 0.72,
    bumpLevel: 0.64,
    comfortScore: 38,
    petStatus: 'anxious',
    riskLevel: 'danger',
    message: 'Cabin temperature may be unsafe. Please take action immediately.',
  },
];

let tick = 0;

function wiggle(value, amount, min, max) {
  const phase = Math.sin(Date.now() / 700 + value);
  const next = value + phase * amount;
  return Math.max(min, Math.min(max, next));
}

export function createMockCabinPacket() {
  const base = scenarios[Math.floor(tick / 8) % scenarios.length];
  tick += 1;

  const packet = {
    ...base,
    temp: Number(wiggle(base.temp, 0.4, 5, 42).toFixed(1)),
    humidity: Math.round(wiggle(base.humidity, 3, 10, 95)),
    motionLevel: Number(wiggle(base.motionLevel, 0.05, 0, 1).toFixed(2)),
    bumpLevel: Number(wiggle(base.bumpLevel, 0.04, 0, 1).toFixed(2)),
    timestamp: Math.floor(Date.now() / 1000),
  };

  return packet;
}

