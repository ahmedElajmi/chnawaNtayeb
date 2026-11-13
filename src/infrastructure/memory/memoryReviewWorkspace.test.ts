import { describeReviewWorkspace } from '../contracts/reviewWorkspace.contract';
import { createMemoryReviewWorkspace } from './memoryReviewWorkspace';

describeReviewWorkspace('memory', () => createMemoryReviewWorkspace<'recipe'>());
