import { describeMatchingScenarioRepository } from '../contracts/matchingScenarioRepository.contract';
import { createMemoryMatchingScenarios } from './memoryMatchingScenarios';

describeMatchingScenarioRepository('in memory', () => createMemoryMatchingScenarios());
