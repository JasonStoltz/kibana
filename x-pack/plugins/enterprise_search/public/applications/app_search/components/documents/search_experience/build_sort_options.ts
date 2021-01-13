/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import { flatten } from 'lodash';

import { Fields, SortOption, SortDirection } from './types';

// Given a schema field name, return a two item array with a descending and ascending sorting
// option for the Search UI <Sorting /> component. Should match the format of DEFAULT_SORT_OPTIONS
const fieldNameToSortOptions = (fieldName: string): SortOption[] =>
  ['asc', 'desc'].map((direction) => ({
    name: `${fieldName} (${direction})`,
    value: fieldName,
    direction: direction as SortDirection,
  }));

export const buildSortOptions = (
  fields: Fields,
  defaultSortOptions: SortOption[]
): SortOption[] => {
  const sortFieldsOptions = flatten(fields.sortFields.map(fieldNameToSortOptions)); // we need to flatten this array since fieldNameToSortOptions returns an array of two sorting options
  const sortingOptions = [...defaultSortOptions, ...sortFieldsOptions];
  return sortingOptions;
};
