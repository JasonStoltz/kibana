/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import { useValues } from 'kea';

import { EuiPanel, EuiSpacer } from '@elastic/eui';

import { CurationsTable, EmptyState } from '../components';
import { SuggestionsTable } from '../components/suggestions_table';
import { CurationsLogic } from '../curations_logic';

export const CurationsOverview: React.FC = () => {
  const { curations } = useValues(CurationsLogic);

  // TODO
  const shouldShowSuggestions = true;

  return (
    <>
      {shouldShowSuggestions && (
        <>
          <SuggestionsTable />
          <EuiSpacer />
        </>
      )}
      {curations.length > 0 ? <CurationsTable /> : <EmptyState />}
    </>
  );
};
