const requiredFields = [
  'temp',
  'humidity',
  'motionLevel',
  'bumpLevel',
  'comfortScore',
  'petStatus',
  'riskLevel',
  'message',
  'timestamp',
];

export function parseCabinData(raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const missing = requiredFields.filter((field) => parsed[field] === undefined);

    if (missing.length > 0) {
      return {
        ok: false,
        data: null,
        raw,
        error: `Missing field: ${missing.join(', ')}`,
      };
    }

    return {
      ok: true,
      data: {
        temp: Number(parsed.temp),
        humidity: Number(parsed.humidity),
        motionLevel: Number(parsed.motionLevel),
        bumpLevel: Number(parsed.bumpLevel),
        comfortScore: Number(parsed.comfortScore),
        petStatus: String(parsed.petStatus),
        riskLevel: String(parsed.riskLevel),
        message: String(parsed.message),
        timestamp: Number(parsed.timestamp),
      },
      raw: typeof raw === 'string' ? raw : JSON.stringify(raw),
      error: '',
    };
  } catch (error) {
    return {
      ok: false,
      data: null,
      raw,
      error: error instanceof Error ? error.message : 'Unable to parse cabin data.',
    };
  }
}

