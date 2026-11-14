import { describeAccountCreation } from '../contracts/accountCreation.contract';
import { createMemoryAccountCreation } from './memoryAccountCreation';

describeAccountCreation('memory', (existing) => createMemoryAccountCreation(existing));
