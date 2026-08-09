function randomDigits(length: number): string {
  let digits = "";
  for (let i = 0; i < length; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }
  return digits;
}

export function generateReservationCode(): string {
  return `FP-R-${randomDigits(5)}`;
}

export function generateCouponCode(): string {
  return `FP-O-${randomDigits(5)}`;
}

/** Postgres unique_violation error code. */
export const UNIQUE_VIOLATION = "23505";
