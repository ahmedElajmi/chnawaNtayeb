import { describeAccountProfile } from '../contracts/accountProfile.contract';
import { createMemoryAccountProfile } from './memoryAccountProfile';

describeAccountProfile('memory', () => createMemoryAccountProfile());
