export const createRfc4648Encode = (
  alphabet: string,
  bitsPerChar: number,
  pad: boolean,
) => {
  return (bytes: Uint8Array): string => {
    const mask = (1 << bitsPerChar) - 1;
    let str = "";

    let bits = 0; // Number of bits currently in the buffer
    let buffer = 0; // Bits waiting to be written out, MSB first
    for (let i = 0; i < bytes.length; ++i) {
      // Slurp data into the buffer:
      buffer = (buffer << 8) | bytes[i];
      bits += 8;

      // Write out as much as we can:
      while (bits > bitsPerChar) {
        bits -= bitsPerChar;
        str += alphabet[mask & (buffer >> bits)];
      }
    }

    // Partial character:
    if (bits !== 0) {
      str += alphabet[mask & (buffer << (bitsPerChar - bits))];
    }

    // Add padding characters until we hit a byte boundary:
    if (pad) {
      while (((str.length * bitsPerChar) & 7) !== 0) {
        str += "=";
      }
    }

    return str;
  };
};

const BASE32_SORTABLE_CHARSET = "234567abcdefghijklmnopqrstuvwxyz";

export const toBase32Sortable = createRfc4648Encode(
  BASE32_SORTABLE_CHARSET,
  5,
  false,
);

function intToArray(i: number) {
  return Uint8Array.of(
    (i & 0xff000000) >> 24,
    (i & 0x00ff0000) >> 16,
    (i & 0x0000ff00) >> 8,
    (i & 0x000000ff) >> 0,
  );
}

/*
 * Generates an ATProto TID using the current timestamp.
 * Encoded as b32-sortable.
 */
export function generateTid() {
  let ms = new Date().getMilliseconds();
  let bytes = intToArray(ms);

  return toBase32Sortable(bytes);
}
