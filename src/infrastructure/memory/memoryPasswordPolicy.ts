import type { PasswordPolicy, PasswordPolicyGateway } from '@/application';
import { DEFAULT_POLICY_LIKE } from './memoryPasswordPolicyDefaults';

/** In-memory password policy: read/save roundtrip for tests. */
export function createMemoryPasswordPolicy(): PasswordPolicyGateway & { stored: PasswordPolicy } {
  let stored: PasswordPolicy = { ...DEFAULT_POLICY_LIKE };
  return {
    get stored() {
      return stored;
    },
    async read() {
      return { ...stored };
    },
    async save(policy) {
      stored = { ...policy };
    },
  };
}
