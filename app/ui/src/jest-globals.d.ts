// tsconfig sets `types: []`, so no @types package is included automatically.
// Test files fall into two camps and both need typings:
//   - explicit `import { ... } from '@jest/globals'` (self-typed; DOM-matcher
//     users import '@testing-library/jest-dom/jest-globals' for augmentation)
//   - implicit globals (`jest.mock` MUST stay a global in files transformed
//     by next/jest — SWC only hoists the implicit form; importing `jest`
//     silently breaks the mock). These references type that camp.
/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />
