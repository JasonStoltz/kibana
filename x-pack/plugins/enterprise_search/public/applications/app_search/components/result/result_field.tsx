/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import { ResultFieldValue } from '.';
import { FieldType, Raw, Snippet } from './types';

import './result_field.scss';

interface Props {
  field: string;
  raw?: Raw;
  snippet?: Snippet;
  type?: FieldType;
}

export const ResultField: React.FC<Props> = ({ field, raw, snippet, type }) => {
  return (
    <div className="appSearchResultField" key={field}>
      <div className="appSearchResultField__key eui-textTruncate">
        <span>{field}</span>
      </div>
      <div className="appSearchResultField__separator" />
      <div className="appSearchResultField__value">
        <ResultFieldValue className="eui-textTruncate" raw={raw} snippet={snippet} type={type} />
      </div>
    </div>
  );
};
