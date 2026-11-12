import { describeSharedCollection } from '../contracts/sharedCollection.contract';
import { describeLocalCollectionCache } from '../contracts/localCollectionCache.contract';
import { createMemorySharedCollection } from './memorySharedCollection';
import { createMemoryCollectionCache } from './memoryCollectionCache';

describeSharedCollection('in memory', () => createMemorySharedCollection());
describeLocalCollectionCache('in memory', () => createMemoryCollectionCache());
