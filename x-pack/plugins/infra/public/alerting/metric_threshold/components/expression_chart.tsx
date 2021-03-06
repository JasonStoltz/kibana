/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useMemo, useCallback } from 'react';
import {
  Axis,
  Chart,
  niceTimeFormatter,
  Position,
  Settings,
  TooltipValue,
  RectAnnotation,
  AnnotationDomainTypes,
  LineAnnotation,
} from '@elastic/charts';
import { first, last } from 'lodash';
import moment from 'moment';
import { i18n } from '@kbn/i18n';
import { EuiText } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';
import { IIndexPattern } from 'src/plugins/data/public';
import { InfraSource } from '../../../../common/http_api/source_api';
import {
  Comparator,
  // eslint-disable-next-line @kbn/eslint/no-restricted-paths
} from '../../../../server/lib/alerting/metric_threshold/types';
import { Color, colorTransformer } from '../../../../common/color_palette';
import { MetricsExplorerRow, MetricsExplorerAggregation } from '../../../../common/http_api';
import { MetricExplorerSeriesChart } from '../../../pages/metrics/metrics_explorer/components/series_chart';
import { MetricExpression } from '../types';
import { MetricsExplorerChartType } from '../../../pages/metrics/metrics_explorer/hooks/use_metrics_explorer_options';
import { getChartTheme } from '../../../pages/metrics/metrics_explorer/components/helpers/get_chart_theme';
import { createFormatterForMetric } from '../../../pages/metrics/metrics_explorer/components/helpers/create_formatter_for_metric';
import { calculateDomain } from '../../../pages/metrics/metrics_explorer/components/helpers/calculate_domain';
import { useMetricsExplorerChartData } from '../hooks/use_metrics_explorer_chart_data';
import { getMetricId } from '../../../pages/metrics/metrics_explorer/components/helpers/get_metric_id';
import { useKibanaContextForPlugin } from '../../../hooks/use_kibana';

interface Props {
  expression: MetricExpression;
  derivedIndexPattern: IIndexPattern;
  source: InfraSource | null;
  filterQuery?: string;
  groupBy?: string | string[];
}

const tooltipProps = {
  headerFormatter: (tooltipValue: TooltipValue) =>
    moment(tooltipValue.value).format('Y-MM-DD HH:mm:ss.SSS'),
};

const TIME_LABELS = {
  s: i18n.translate('xpack.infra.metrics.alerts.timeLabels.seconds', { defaultMessage: 'seconds' }),
  m: i18n.translate('xpack.infra.metrics.alerts.timeLabels.minutes', { defaultMessage: 'minutes' }),
  h: i18n.translate('xpack.infra.metrics.alerts.timeLabels.hours', { defaultMessage: 'hours' }),
  d: i18n.translate('xpack.infra.metrics.alerts.timeLabels.days', { defaultMessage: 'days' }),
};

export const ExpressionChart: React.FC<Props> = ({
  expression,
  derivedIndexPattern,
  source,
  filterQuery,
  groupBy,
}) => {
  const { loading, data } = useMetricsExplorerChartData(
    expression,
    derivedIndexPattern,
    source,
    filterQuery,
    groupBy
  );

  const { uiSettings } = useKibanaContextForPlugin().services;

  const metric = {
    field: expression.metric,
    aggregation: expression.aggType as MetricsExplorerAggregation,
    color: Color.color0,
  };
  const isDarkMode = uiSettings?.get('theme:darkMode') || false;
  const dateFormatter = useMemo(() => {
    const firstSeries = first(data?.series);
    const firstTimestamp = first(firstSeries?.rows)?.timestamp;
    const lastTimestamp = last(firstSeries?.rows)?.timestamp;

    if (firstTimestamp == null || lastTimestamp == null) {
      return (value: number) => `${value}`;
    }

    return niceTimeFormatter([firstTimestamp, lastTimestamp]);
  }, [data?.series]);

  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  const yAxisFormater = useCallback(createFormatterForMetric(metric), [expression]);

  if (loading || !data) {
    return (
      <EmptyContainer>
        <EuiText color="subdued">
          <FormattedMessage
            id="xpack.infra.metrics.alerts.loadingMessage"
            defaultMessage="Loading"
          />
        </EuiText>
      </EmptyContainer>
    );
  }

  const criticalThresholds = expression.threshold.slice().sort();
  const warningThresholds = expression.warningThreshold?.slice().sort() ?? [];
  const thresholds = [...criticalThresholds, ...warningThresholds].sort();

  // Creating a custom series where the ID is changed to 0
  // so that we can get a proper domian
  const firstSeries = first(data.series);
  if (!firstSeries || !firstSeries.rows || firstSeries.rows.length === 0) {
    return (
      <EmptyContainer>
        <EuiText color="subdued" data-test-subj="noChartData">
          <FormattedMessage
            id="xpack.infra.metrics.alerts.noDataMessage"
            defaultMessage="Oops, no chart data available"
          />
        </EuiText>
      </EmptyContainer>
    );
  }

  const series = {
    ...firstSeries,
    rows: firstSeries.rows.map((row) => {
      const newRow: MetricsExplorerRow = { ...row };
      thresholds.forEach((thresholdValue, index) => {
        newRow[getMetricId(metric, `threshold_${index}`)] = thresholdValue;
      });
      return newRow;
    }),
  };

  const firstTimestamp = first(firstSeries.rows)!.timestamp;
  const lastTimestamp = last(firstSeries.rows)!.timestamp;
  const dataDomain = calculateDomain(series, [metric], false);
  const domain = {
    max: Math.max(dataDomain.max, last(thresholds) || dataDomain.max) * 1.1, // add 10% headroom.
    min: Math.min(dataDomain.min, first(thresholds) || dataDomain.min) * 0.9, // add 10% floor,
  };

  if (domain.min === first(expression.threshold)) {
    domain.min = domain.min * 0.9;
  }

  const opacity = 0.3;
  const { timeSize, timeUnit } = expression;
  const timeLabel = TIME_LABELS[timeUnit as keyof typeof TIME_LABELS];

  const ThresholdAnnotations = ({
    threshold,
    sortedThresholds,
    comparator,
    color,
    id,
  }: Partial<MetricExpression> & { sortedThresholds: number[]; color: Color; id: string }) => {
    if (!comparator || !threshold) return null;
    const isAbove = [Comparator.GT, Comparator.GT_OR_EQ].includes(comparator);
    const isBelow = [Comparator.LT, Comparator.LT_OR_EQ].includes(comparator);
    return (
      <>
        <LineAnnotation
          id={`${id}-thresholds`}
          domainType={AnnotationDomainTypes.YDomain}
          dataValues={sortedThresholds.map((t) => ({
            dataValue: t,
          }))}
          style={{
            line: {
              strokeWidth: 2,
              stroke: colorTransformer(color),
              opacity: 1,
            },
          }}
        />
        {sortedThresholds.length === 2 && comparator === Comparator.BETWEEN ? (
          <>
            <RectAnnotation
              id={`${id}-lower-threshold`}
              style={{
                fill: colorTransformer(color),
                opacity,
              }}
              dataValues={[
                {
                  coordinates: {
                    x0: firstTimestamp,
                    x1: lastTimestamp,
                    y0: first(expression.threshold),
                    y1: last(expression.threshold),
                  },
                },
              ]}
            />
          </>
        ) : null}
        {sortedThresholds.length === 2 && comparator === Comparator.OUTSIDE_RANGE ? (
          <>
            <RectAnnotation
              id={`${id}-lower-threshold`}
              style={{
                fill: colorTransformer(color),
                opacity,
              }}
              dataValues={[
                {
                  coordinates: {
                    x0: firstTimestamp,
                    x1: lastTimestamp,
                    y0: domain.min,
                    y1: first(threshold),
                  },
                },
              ]}
            />
            <RectAnnotation
              id={`${id}-upper-threshold`}
              style={{
                fill: colorTransformer(color),
                opacity,
              }}
              dataValues={[
                {
                  coordinates: {
                    x0: firstTimestamp,
                    x1: lastTimestamp,
                    y0: last(threshold),
                    y1: domain.max,
                  },
                },
              ]}
            />
          </>
        ) : null}
        {isBelow && first(threshold) != null ? (
          <RectAnnotation
            id={`${id}-upper-threshold`}
            style={{
              fill: colorTransformer(color),
              opacity,
            }}
            dataValues={[
              {
                coordinates: {
                  x0: firstTimestamp,
                  x1: lastTimestamp,
                  y0: domain.min,
                  y1: first(threshold),
                },
              },
            ]}
          />
        ) : null}
        {isAbove && first(threshold) != null ? (
          <RectAnnotation
            id={`${id}-upper-threshold`}
            style={{
              fill: colorTransformer(color),
              opacity,
            }}
            dataValues={[
              {
                coordinates: {
                  x0: firstTimestamp,
                  x1: lastTimestamp,
                  y0: first(threshold),
                  y1: domain.max,
                },
              },
            ]}
          />
        ) : null}
      </>
    );
  };

  return (
    <>
      <ChartContainer>
        <Chart>
          <MetricExplorerSeriesChart
            type={MetricsExplorerChartType.bar}
            metric={metric}
            id="0"
            series={series}
            stack={false}
          />
          <ThresholdAnnotations
            comparator={expression.comparator}
            threshold={expression.threshold}
            sortedThresholds={criticalThresholds}
            color={Color.color1}
            id="critical"
          />
          {expression.warningComparator && expression.warningThreshold && (
            <ThresholdAnnotations
              comparator={expression.warningComparator}
              threshold={expression.warningThreshold}
              sortedThresholds={warningThresholds}
              color={Color.color5}
              id="warning"
            />
          )}
          <Axis
            id={'timestamp'}
            position={Position.Bottom}
            showOverlappingTicks={true}
            tickFormat={dateFormatter}
          />
          <Axis id={'values'} position={Position.Left} tickFormat={yAxisFormater} domain={domain} />
          <Settings tooltip={tooltipProps} theme={getChartTheme(isDarkMode)} />
        </Chart>
      </ChartContainer>
      <div style={{ textAlign: 'center' }}>
        {series.id !== 'ALL' ? (
          <EuiText size="xs" color="subdued">
            <FormattedMessage
              id="xpack.infra.metrics.alerts.dataTimeRangeLabelWithGrouping"
              defaultMessage="Last {lookback} {timeLabel} of data for {id}"
              values={{ id: series.id, timeLabel, lookback: timeSize! * 20 }}
            />
          </EuiText>
        ) : (
          <EuiText size="xs" color="subdued">
            <FormattedMessage
              id="xpack.infra.metrics.alerts.dataTimeRangeLabel"
              defaultMessage="Last {lookback} {timeLabel}"
              values={{ timeLabel, lookback: timeSize! * 20 }}
            />
          </EuiText>
        )}
      </div>
    </>
  );
};

const EmptyContainer: React.FC = ({ children }) => (
  <div
    style={{
      width: '100%',
      height: 150,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    {children}
  </div>
);

const ChartContainer: React.FC = ({ children }) => (
  <div
    style={{
      width: '100%',
      height: 150,
    }}
  >
    {children}
  </div>
);
