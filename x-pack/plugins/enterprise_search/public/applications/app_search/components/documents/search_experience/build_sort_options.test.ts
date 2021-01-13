/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { buildSortOptions } from './build_sort_options';

describe('buildSortOptions', () => {
  it('builds sort options from fields', () => {
    const newSortOptions = buildSortOptions(
      {
        filterFields: [],
        sortFields: ['fieldA', 'fieldB'],
      },
      [
        {
          name: 'Relevance ASC',
          value: 'id',
          direction: 'desc',
        },
        {
          name: 'Relevance DESC',
          value: 'id',
          direction: 'asc',
        },
      ]
    );

    expect(newSortOptions).toEqual([
      {
        name: 'Relevance ASC',
        value: 'id',
        direction: 'desc',
      },
      {
        name: 'Relevance DESC',
        value: 'id',
        direction: 'asc',
      },
      {
        direction: 'asc',
        name: 'fieldA (asc)',
        value: 'fieldA',
      },
      {
        direction: 'desc',
        name: 'fieldA (desc)',
        value: 'fieldA',
      },
      {
        direction: 'asc',
        name: 'fieldB (asc)',
        value: 'fieldB',
      },
      {
        direction: 'desc',
        name: 'fieldB (desc)',
        value: 'fieldB',
      },
    ]);
  });
});
