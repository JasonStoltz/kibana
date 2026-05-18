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
import { action } from '@storybook/addon-actions';
import { EuiBasicTable, type EuiBasicTableColumn } from '@elastic/eui';

import { columnPresetActions } from './src/actions';

interface Row {
  id: string;
  name: string;
  description: string;
}

const rows: Row[] = [
  { id: '1', name: 'alpha', description: 'First item' },
  { id: '2', name: 'beta', description: 'Second item' },
  { id: '3', name: 'gamma', description: 'Third item' },
];

const meta: Meta = {
  title: 'Column presets/Presets',
};

export default meta;

type Story = StoryObj;

export const Actions: Story = {
  name: 'columnPresetActions',
  render: () => {
    const columns: Array<EuiBasicTableColumn<Row>> = [
      { field: 'name', name: 'Name' },
      { field: 'description', name: 'Description' },
      {
        ...columnPresetActions({}),
        name: 'Actions',
        actions: [
          {
            name: 'Edit',
            description: 'Edit this row',
            icon: 'pencil',
            type: 'icon',
            onClick: action('edit'),
          },
          {
            name: 'Delete',
            description: 'Delete this row',
            icon: 'trash',
            type: 'icon',
            color: 'danger',
            onClick: action('delete'),
          },
        ],
      },
    ];

    return <EuiBasicTable items={rows} columns={columns} rowHeader="name" tableCaption="" />;
  },
};
