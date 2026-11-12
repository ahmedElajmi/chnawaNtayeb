import { describeRecipeDraftRepository } from '../contracts/recipeDraftRepository.contract';
import { createMemoryRecipeDrafts } from './memoryRecipeDrafts';

describeRecipeDraftRepository('in memory', () => createMemoryRecipeDrafts());
