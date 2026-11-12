import { describeRecipeDraftRepository } from '../contracts/recipeDraftRepository.contract';
import { createLocalRecipeDrafts, type KeyValueStore } from './localRecipeDrafts';

function fakeStore(): KeyValueStore {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describeRecipeDraftRepository('device storage', () => {
  const store = fakeStore();
  return createLocalRecipeDrafts(() => store);
});
