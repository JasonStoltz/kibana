/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { kea, MakeLogicType } from 'kea';

import { flashSuccessToast } from '../../../../../shared/flash_messages';
import { defaultErrorMessage } from '../../../../../shared/flash_messages/handle_api_errors';

import { HttpLogic } from '../../../../../shared/http';
import { EngineLogic } from '../../../engine';

import { CrawlerOverviewLogic } from '../../crawler_overview_logic';
import { CrawlerDataFromServer, CrawlerDomain } from '../../types';
import { crawlerDataServerToClient } from '../../utils';

import { extractDomainAndEntryPointFromUrl } from './utils';

export interface AddDomainLogicValues {
  addDomainFormInputValue: string;
  allowSubmit: boolean;
  hasValidationCompleted: boolean;
  entryPointValue: string;
  errors: string[];
}

export interface AddDomainLogicActions {
  clearDomainFormInputValue(): void;
  setAddDomainFormInputValue(newValue: string): string;
  onSubmitNewDomainError(errors: string[]): { errors: string[] };
  onSubmitNewDomainSuccess(domain: CrawlerDomain): { domain: CrawlerDomain };
  onValidateDomain(
    newValue: string,
    newEntryPointValue: string
  ): { newValue: string; newEntryPointValue: string };
  submitNewDomain(): void;
  validateDomain(): void;
}

export const AddDomainLogic = kea<MakeLogicType<AddDomainLogicValues, AddDomainLogicActions>>({
  path: ['enterprise_search', 'app_search', 'crawler', 'add_domain'],
  actions: () => ({
    clearDomainFormInputValue: true,
    setAddDomainFormInputValue: (newValue) => newValue,
    onSubmitNewDomainSuccess: (domain) => ({ domain }),
    onSubmitNewDomainError: (errors) => ({ errors }),
    onValidateDomain: (newValue, newEntryPointValue) => ({
      newValue,
      newEntryPointValue,
    }),
    submitNewDomain: true,
    validateDomain: true,
  }),
  reducers: () => ({
    addDomainFormInputValue: [
      'https://',
      {
        clearDomainFormInputValue: () => 'https://',
        setAddDomainFormInputValue: (_, newValue: string) => newValue,
        onValidateDomain: (_, { newValue }: { newValue: string }) => newValue,
      },
    ],
    entryPointValue: [
      '/',
      {
        clearDomainFormInputValue: () => '/',
        setAddDomainFormInputValue: () => '/',
        onValidateDomain: (_, { newEntryPointValue }) => newEntryPointValue,
      },
    ],
    // TODO When 4-step validation is added this will become a selector as
    // we'll use individual step results to determine whether this is true/false
    hasValidationCompleted: [
      false,
      {
        clearDomainFormInputValue: () => false,
        setAddDomainFormInputValue: () => false,
        onValidateDomain: () => true,
      },
    ],
    errors: [
      [],
      {
        clearDomainFormInputValue: () => [],
        setAddDomainFormInputValue: () => [],
        onValidateDomain: () => [],
        submitNewDomain: () => [],
        onSubmitNewDomainError: (_, { errors }) => errors,
      },
    ],
  }),
  selectors: ({ selectors }) => ({
    // TODO include selectors.blockingFailures once 4-step validation is migrated
    allowSubmit: [
      () => [selectors.hasValidationCompleted], // should eventually also contain selectors.hasBlockingFailures when that is added
      (hasValidationCompleted: boolean) => hasValidationCompleted, // && !hasBlockingFailures
    ],
  }),
  listeners: ({ actions, values }) => ({
    onSubmitNewDomainSuccess: (/* { domain }*/) => {
      flashSuccessToast('Successfully added domain.');
      // TODO After Single Domain View is added
      // KibanaLogic.values.navigateToUrl(
      //   crawlerSingleDomainRoute(
      //     EngineLogic.values.engineName,
      //     domain.id
      //   )
      // );
    },
    submitNewDomain: async () => {
      const { http } = HttpLogic.values;
      const { engineName } = EngineLogic.values;

      const requestBody = JSON.stringify({
        name: values.addDomainFormInputValue.trim(),
        entry_points: [{ value: values.entryPointValue }],
      });

      try {
        const response = await http.post(`/api/app_search/engines/${engineName}/crawler/domains`, {
          query: {
            respond_with: 'crawler_details',
          },
          body: requestBody,
        });

        const crawlerData = crawlerDataServerToClient(response as CrawlerDataFromServer);
        CrawlerOverviewLogic.actions.onReceiveCrawlerData(crawlerData);
        const newDomain = crawlerData.domains[crawlerData.domains.length - 1];
        if (newDomain) {
          actions.onSubmitNewDomainSuccess(newDomain);
        }
        // If there is not a new domain, that means the server responded with a 200 but
        // didn't actually persist the new domain to our BE, and we take no action
      } catch (e) {
        // we surface errors
        const errorMessages = Array.isArray(e?.body?.attributes?.errors)
          ? (e.body!.attributes.errors as string[])
          : [(e?.body?.message as string) || defaultErrorMessage];
        actions.onSubmitNewDomainError(errorMessages);
      }
    },
    validateDomain: () => {
      const {
        domain: newUrlValue,
        entryPoint: newEntryPointValue,
      } = extractDomainAndEntryPointFromUrl(values.addDomainFormInputValue.trim());
      actions.onValidateDomain(newUrlValue, newEntryPointValue);
    },
  }),
});
