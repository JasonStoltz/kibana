/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { DestructiveRouteMethod, RouteConfig, RouteConfigOptions } from 'kibana/server';

import { schema } from '@kbn/config-schema';

/**
 * Kibana Enterprise Search Plugin API endpoints often times pass through the request
 * body to the Enterprise Search API endpoints for validation. In those cases, we do not
 * need to validate them in Kibana.
 *
 * The safe way to do that is to turn off body parsing entirely using `options.body.parse: false`.
 * The will pass a String Buffer to the route handler. The proper way to validate this when validation
 * is enabled to to use `body: schema.buffer()`.
 *
 * @see https://github.com/elastic/kibana/blob/master/docs/development/core/server/kibana-plugin-core-server.routeconfigoptionsbody.md
 * @see https://github.com/elastic/kibana/blob/master/packages/kbn-config-schema/README.md#schemabuffer
 *
 * Example:
 *  router.put({
 *    path: '/api/app_search/engines/{engineName}/example',
 *    validate: {
 *      params: schema.object({
 *        engineName: schema.string(),
 *      }),
 *      body: schema.buffer(),
 *    },
 *    options: { body: { parse: false } },
 *  },
 *  ...
 *
 * This helper applies that pattern, while maintaining existing options:
 *
 *  router.put(skipBodyValidation({
 *    path: '/api/app_search/engines/{engineName}/example',
 *    validate: {
 *      params: schema.object({
 *        engineName: schema.string(),
 *      }),
 *    },
 *  },
 *  ...
 */
export const skipBodyValidation = <Method extends DestructiveRouteMethod>(
  // DestructiveRouteMethod is the Kibana type for everything except 'get' and 'options'.
  // Body configuration doesn't apply to those types so we disallow it with this helper.
  config: RouteConfig<unknown, unknown, unknown, Method>
): RouteConfig<unknown, unknown, unknown, Method> => {
  const options = config.options || {};

  // We throw here rather than overwriting the existing settings to avoid confusion
  if (config.validate && config.validate.body) {
    throw new Error('validate.body cannot be set when using "skipBodyValidation"');
  }
  if (options.body) {
    throw new Error('options.body cannot be set when using "skipBodyValidation"');
  }
  return {
    ...config,
    validate:
      config.validate === false
        ? false
        : {
            ...config.validate,
            body: schema.buffer(),
          },
    options: {
      ...(config.options || {}),
      body: {
        parse: false,
      } as RouteConfigOptions<Method>['body'],
    },
  };
};
