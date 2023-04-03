function generateRandomBoolean(): boolean {
  return Math.random() >= 0.5;
}

export function generateRandomLatitude(): number {
  return (generateRandomBoolean() ? 1 : -1) * ((Math.random() * 100) % 90);
}

export function generateRandomLongitude(): number {
  return (generateRandomBoolean() ? 1 : -1) * ((Math.random() * 1000) % 180);
}
