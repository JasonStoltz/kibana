/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { EuiBasicTable, type EuiBasicTableColumn } from '@elastic/eui';

import { EmptyCellValue, EmptyCellString } from './src/empty_values';

interface Row {
  id: string;
  name: string;
  description: string | null | undefined;
}

const rows: Row[] = [
  { id: '1', name: 'alpha', description: 'A populated description' },
  { id: '2', name: 'beta', description: '' },
  { id: '3', name: 'gamma', description: null },
  { id: '4', name: 'delta', description: undefined },
];

const renderDescription = (value: string | null | undefined) => {
  if (value == null) return <EmptyCellValue />;
  if (value === '') return <EmptyCellString />;
  return value;
};

const meta: Meta = {
  title: 'Column presets/Cell renderers',
};

export default meta;

type Story = StoryObj;

export const EmptyValues: Story = {
  name: 'EmptyCellValue & EmptyCellString',
  render: () => {
    const columns: Array<EuiBasicTableColumn<Row>> = [
      { field: 'name', name: 'Name' },
      {
        field: 'description',
        name: 'Description',
        render: renderDescription,
      },
    ];

    return <EuiBasicTable items={rows} columns={columns} rowHeader="name" tableCaption="" />;
  },
};
