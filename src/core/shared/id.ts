/** Generates ids such as `grocery_lq3x9k_4f2a`. Injected where determinism is needed (tests). */
export type IdFactory = (prefix: string) => string;

export const createId: IdFactory = (prefix) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
