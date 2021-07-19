/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

export const mockSetState = jest.fn();
export const mockUseState = jest.fn((initState) => [initState, jest.fn()]);

jest.mock('react', () => ({
  ...(jest.requireActual('react') as object),
  useState: mockUseState,
}));
