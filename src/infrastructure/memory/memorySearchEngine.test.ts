import { describeSearchEngine } from '../contracts/searchEngine.contract';
import { createMemorySearchEngine } from './memorySearchEngine';

describeSearchEngine('in memory', () => createMemorySearchEngine());
