import { describeAccountDirectory } from '../contracts/accountDirectory.contract';
import { createMemoryAccountDirectory } from './memoryAccountDirectory';

describeAccountDirectory('memory', () =>
  createMemoryAccountDirectory([
    { uid: 'u3', type: 'employee', email: 'chef@b.co', displayName: 'Chef', isAnonymous: false },
    {
      uid: 'u1',
      type: 'client',
      email: 'amine@b.co',
      displayName: 'Amine',
      phone: '+21620123456',
      isAnonymous: false,
      lastLogin: '2026-01-01',
    },
    { uid: 'u2', type: 'client', email: 'sami@b.co', isAnonymous: false },
    { uid: 'u4', email: 'legacy@b.co', isAnonymous: false },
    { uid: 'u5', isAnonymous: true },
  ])
);
