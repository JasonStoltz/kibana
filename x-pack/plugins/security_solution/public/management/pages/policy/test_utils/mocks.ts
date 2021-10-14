/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { HttpFetchOptionsWithPath } from 'kibana/public';
import {
  composeHttpHandlerMocks,
  httpHandlerMockFactory,
  ResponseProvidersInterface,
} from '../../../../common/mock/endpoint/http_handler_mock_factory';
import {
  GetTrustedAppsListRequest,
  GetTrustedAppsListResponse,
  PostTrustedAppCreateResponse,
} from '../../../../../common/endpoint/types';
import { TRUSTED_APPS_LIST_API } from '../../../../../common/endpoint/constants';
import { TrustedAppGenerator } from '../../../../../common/endpoint/data_generators/trusted_app_generator';
import { createSampleTrustedApps, createSampleTrustedApp } from '../../trusted_apps/test_utils';
import {
  PolicyDetailsArtifactsPageListLocationParams,
  PolicyDetailsArtifactsPageLocation,
} from '../types';
import {
  fleetGetAgentStatusHttpMock,
  FleetGetAgentStatusHttpMockInterface,
  fleetGetEndpointPackagePolicyHttpMock,
  FleetGetEndpointPackagePolicyHttpMockInterface,
  fleetGetEndpointPackagePolicyListHttpMock,
  FleetGetEndpointPackagePolicyListHttpMockInterface,
} from '../../mocks';

export const getMockListResponse: () => GetTrustedAppsListResponse = () => ({
  data: createSampleTrustedApps({}),
  per_page: 100,
  page: 1,
  total: 100,
});

export const getMockPolicyDetailsArtifactsPageLocationUrlParams = (
  overrides: Partial<PolicyDetailsArtifactsPageLocation> = {}
): PolicyDetailsArtifactsPageLocation => {
  return {
    page_index: 0,
    page_size: 10,
    filter: '',
    show: undefined,
    ...overrides,
  };
};

export const getMockPolicyDetailsArtifactListUrlParams = (
  overrides: Partial<PolicyDetailsArtifactsPageListLocationParams> = {}
): PolicyDetailsArtifactsPageListLocationParams => {
  return {
    page_index: 0,
    page_size: 10,
    filter: '',
    ...overrides,
  };
};

export const getMockCreateResponse: () => PostTrustedAppCreateResponse = () =>
  createSampleTrustedApp(1) as unknown as unknown as PostTrustedAppCreateResponse;

export const getAPIError = () => ({
  statusCode: 500,
  error: 'Internal Server Error',
  message: 'Something is not right',
});

type PolicyDetailsTrustedAppsHttpMocksInterface = ResponseProvidersInterface<{
  policyTrustedAppsList: (options: HttpFetchOptionsWithPath) => GetTrustedAppsListResponse;
}>;

/**
 * HTTP mocks that support the Trusted Apps tab of the Policy Details page
 */
export const policyDetailsTrustedAppsHttpMocks =
  httpHandlerMockFactory<PolicyDetailsTrustedAppsHttpMocksInterface>([
    {
      id: 'policyTrustedAppsList',
      path: TRUSTED_APPS_LIST_API,
      method: 'get',
      handler: ({ query }): GetTrustedAppsListResponse => {
        const apiQueryParams = query as GetTrustedAppsListRequest;
        const generator = new TrustedAppGenerator('seed');
        const perPage = apiQueryParams.per_page ?? 10;
        const data = Array.from({ length: Math.min(perPage, 50) }, () => generator.generate());

        // Change the 3rd entry (index 2) to be policy specific
        data[2].effectScope = {
          type: 'policy',
          policies: [
            // IDs below are those generated by the `fleetGetEndpointPackagePolicyListHttpMock()` mock
            'ddf6570b-9175-4a6d-b288-61a09771c647',
            'b8e616ae-44fc-4be7-846c-ce8fa5c082dd',
          ],
        };

        return {
          page: apiQueryParams.page ?? 1,
          per_page: perPage,
          total: 20,
          data,
        };
      },
    },
  ]);

export type PolicyDetailsPageAllApiHttpMocksInterface =
  FleetGetEndpointPackagePolicyHttpMockInterface &
    FleetGetAgentStatusHttpMockInterface &
    FleetGetEndpointPackagePolicyListHttpMockInterface &
    PolicyDetailsTrustedAppsHttpMocksInterface;
export const policyDetailsPageAllApiHttpMocks =
  composeHttpHandlerMocks<PolicyDetailsPageAllApiHttpMocksInterface>([
    fleetGetEndpointPackagePolicyHttpMock,
    fleetGetAgentStatusHttpMock,
    fleetGetEndpointPackagePolicyListHttpMock,
    policyDetailsTrustedAppsHttpMocks,
  ]);
