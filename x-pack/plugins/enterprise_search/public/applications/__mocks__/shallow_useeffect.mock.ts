/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

let mockUmountHandler: () => void;

jest.mock('react', () => ({
  ...(jest.requireActual('react') as object),
  useEffect: jest.fn((fn) => {
    mockUmountHandler = fn();
    return mockUmountHandler;
  }), // Calls on mount/every update - use mount for more complex behavior
}));

// Helper for calling the returned useEffect unmount handler
export const unmountHandler = () => mockUmountHandler();

/**
 * Example usage within a component test using shallow():
 *
 * import '../../../__mocks__/shallow_useeffect.mock'; // Must come before React's import, adjust relative path as needed
 *
 * import React from 'react';
 * import { shallow } from 'enzyme';
 *
 * // ... etc.
 */
/**
 * Example unmount() usage:
 *
 * import { unmountHandler } from '../../../__mocks__/shallow_useeffect.mock';
 *
 * it('unmounts', () => {
 *   shallow(SomeComponent);
 *   unmountHandler();
 *   // expect something to have been done on unmount (NOTE: the component is not actually unmounted)
 * });
 */
