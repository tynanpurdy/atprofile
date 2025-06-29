/**
 * TID (Transaction ID) implementation for ATProto
 * Based on the original Go implementation from github.com/bluesky-social/indigo
 */

// Base32 alphabet used for sorting
const BASE32_SORT_ALPHABET = "234567abcdefghijklmnopqrstuvwxyz";

// Constants for bit operations
const CLOCK_ID_MASK = 0x3ff;
const MICROS_MASK = 0x1f_ffff_ffff_ffffn;
const INTEGER_MASK = 0x7fff_ffff_ffff_ffffn;

class TransactionId {
  private readonly value: string;

  constructor(value: string) {
    this.value = value;
  }

  toString(): string {
    return this.value;
  }

  static create(unixMicros: bigint, clockId: number): TransactionId {
    const clockIdBig = BigInt(clockId & CLOCK_ID_MASK);
    const v = ((unixMicros & MICROS_MASK) << 10n) | clockIdBig;
    return TransactionId.fromInteger(v);
  }

  static createNow(clockId: number): TransactionId {
    const nowMicros = BigInt(Date.now()) * 1000n; // Convert ms to μs
    return TransactionId.create(nowMicros, clockId);
  }

  private static fromInteger(value: bigint): TransactionId {
    value = INTEGER_MASK & value;
    let result = "";

    for (let i = 0; i < 13; i++) {
      result = BASE32_SORT_ALPHABET[Number(value & 0x1fn)] + result;
      value = value >> 5n;
    }

    return new TransactionId(result);
  }
}

/**
 * Extracts timestamp from a TID string
 * @param tid - The TID string to parse
 * @returns Date object representing the timestamp
 */
export function tidToTime(tid: string): Date {
  // Convert TID string to integer
  let value = 0n;
  for (let i = 0; i < Math.min(tid.length, 13); i++) {
    const char = tid[i];
    const charValue = BASE32_SORT_ALPHABET.indexOf(char);
    if (charValue === -1) {
      throw new Error(`Invalid base32 character: ${char}`);
    }
    value = (value << 5n) | BigInt(charValue);
  }

  // Extract timestamp (shift right 10 bits to remove clock ID, mask to get microseconds)
  const micros = (value >> 10n) & 0x1fff_ffff_ffff_ffffn;

  // Convert microseconds to milliseconds for JavaScript Date
  const millis = Number(micros / 1000n);

  return new Date(millis);
}

/**
 * Generates a new Transaction ID with a random clock ID
 * @returns TransactionId
 */
export function generateTid(): TransactionId {
  const clockId = Math.floor(Math.random() * 64 + 512);
  return TransactionId.createNow(clockId);
}
