import { hash as argon2Hash, verify as argon2Verify } from '@node-rs/argon2';

/**
 * Password hashing with a swappable algorithm. The stored string follows the PHC format —
 * it embeds the algorithm and its parameters — so old hashes stay verifiable after the
 * configured algorithm changes, and each hash is portable to any future storage.
 */

export interface PasswordHasher {
  /** Algorithm id, as it appears in the PHC string */
  id: string;
  /** Hashes with the given parameters (when the algorithm takes any) */
  hash(plain: string, params?: Record<string, number>): Promise<string>;
  /** Verifies a PHC string produced by this algorithm */
  verify(phc: string, plain: string): Promise<boolean>;
}

const ARGON2_DEFAULTS = { memoryCost: 65536, timeCost: 3, parallelism: 4 };

const argon2idHasher: PasswordHasher = {
  id: 'argon2id',
  async hash(plain, params) {
    const options = {
      memoryCost: params?.memoryCost ?? ARGON2_DEFAULTS.memoryCost,
      timeCost: params?.timeCost ?? ARGON2_DEFAULTS.timeCost,
      parallelism: params?.parallelism ?? ARGON2_DEFAULTS.parallelism,
    };
    return argon2Hash(plain, options);
  },
  async verify(phc, plain) {
    return argon2Verify(phc, plain);
  },
};

const HASHERS: Record<string, PasswordHasher> = { argon2id: argon2idHasher };

/** The algorithm new passwords are hashed with (the backoffice configuration picks the id). */
export function preferredHasher(algorithm: string): PasswordHasher {
  return HASHERS[algorithm] ?? argon2idHasher;
}

/** Verifies any stored hash: the algorithm is read from the PHC string itself. */
export function verifyPassword(storedPhc: string, plain: string): Promise<boolean> {
  const id = storedPhc.split('$')[1];
  const hasher = HASHERS[id];
  if (!hasher) return Promise.resolve(false);
  return hasher.verify(storedPhc, plain);
}

/** True when the stored hash was not produced by the configured algorithm (lazy migration). */
export function needsUpgrade(storedPhc: string, algorithm: string): boolean {
  return storedPhc.split('$')[1] !== algorithm;
}
