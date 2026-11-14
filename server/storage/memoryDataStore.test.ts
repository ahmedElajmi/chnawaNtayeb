import { describeDataStore } from './contract';
import { createMemoryDataStore } from './memoryDataStore';

describeDataStore('memory', () => createMemoryDataStore());
