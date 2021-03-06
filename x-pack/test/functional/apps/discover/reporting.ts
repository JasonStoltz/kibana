/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';
import { FtrProviderContext } from '../../ftr_provider_context';

export default function ({ getService, getPageObjects }: FtrProviderContext) {
  const log = getService('log');
  const es = getService('es');
  const esArchiver = getService('esArchiver');
  const browser = getService('browser');
  const PageObjects = getPageObjects(['reporting', 'common', 'discover', 'timePicker']);
  const filterBar = getService('filterBar');

  describe('Discover', () => {
    before('initialize tests', async () => {
      log.debug('ReportingPage:initTests');
      await esArchiver.loadIfNeeded('reporting/ecommerce');
      await browser.setWindowSize(1600, 850);
    });
    after('clean up archives', async () => {
      await esArchiver.unload('reporting/ecommerce');
      await es.deleteByQuery({
        index: '.reporting-*',
        refresh: true,
        body: { query: { match_all: {} } },
      });
    });

    describe('Generate CSV: new search', () => {
      beforeEach(() => PageObjects.common.navigateToApp('discover'));

      it('is not available if new', async () => {
        await PageObjects.reporting.openCsvReportingPanel();
        expect(await PageObjects.reporting.isGenerateReportButtonDisabled()).to.be('true');
      });

      it('becomes available when saved', async () => {
        await PageObjects.discover.saveSearch('my search - expectEnabledGenerateReportButton');
        await PageObjects.reporting.openCsvReportingPanel();
        expect(await PageObjects.reporting.isGenerateReportButtonDisabled()).to.be(null);
      });

      it('becomes available/not available when a saved search is created, changed and saved again', async () => {
        // create new search, csv export is not available
        await PageObjects.discover.clickNewSearchButton();
        await PageObjects.reporting.openCsvReportingPanel();
        expect(await PageObjects.reporting.isGenerateReportButtonDisabled()).to.be('true');
        // save search, csv export is available
        await PageObjects.discover.saveSearch('my search - expectEnabledGenerateReportButton 2');
        await PageObjects.reporting.openCsvReportingPanel();
        expect(await PageObjects.reporting.isGenerateReportButtonDisabled()).to.be(null);
        // add filter, csv export is not available
        await filterBar.addFilter('currency', 'is', 'EUR');
        await PageObjects.reporting.openCsvReportingPanel();
        expect(await PageObjects.reporting.isGenerateReportButtonDisabled()).to.be('true');
        // save search again, csv export is available
        await PageObjects.discover.saveSearch('my search - expectEnabledGenerateReportButton 2');
        await PageObjects.reporting.openCsvReportingPanel();
        expect(await PageObjects.reporting.isGenerateReportButtonDisabled()).to.be(null);
      });

      it('generates a report with data', async () => {
        await PageObjects.discover.clickNewSearchButton();
        await PageObjects.reporting.setTimepickerInDataRange();
        await PageObjects.discover.saveSearch('my search - with data - expectReportCanBeCreated');
        await PageObjects.reporting.openCsvReportingPanel();
        await PageObjects.reporting.clickGenerateReportButton();

        const url = await PageObjects.reporting.getReportURL(60000);
        const res = await PageObjects.reporting.getResponse(url);

        expect(res.status).to.equal(200);
        expect(res.get('content-type')).to.equal('text/csv; charset=utf-8');
        expectSnapshot(res.text).toMatch();
      });

      it('generates a report with no data', async () => {
        await PageObjects.reporting.setTimepickerInNoDataRange();
        await PageObjects.discover.saveSearch('my search - no data - expectReportCanBeCreated');
        await PageObjects.reporting.openCsvReportingPanel();
        await PageObjects.reporting.clickGenerateReportButton();

        const url = await PageObjects.reporting.getReportURL(60000);
        const res = await PageObjects.reporting.getResponse(url);

        expect(res.status).to.equal(200);
        expect(res.get('content-type')).to.equal('text/csv; charset=utf-8');
        expectSnapshot(res.text).toMatchInline(`
          "
          "
        `);
      });
    });

    describe('Generate CSV: archived search', () => {
      before(async () => {
        await esArchiver.load('reporting/ecommerce');
        await esArchiver.load('reporting/ecommerce_kibana');
      });

      after(async () => {
        await esArchiver.unload('reporting/ecommerce');
        await esArchiver.unload('reporting/ecommerce_kibana');
      });

      beforeEach(() => PageObjects.common.navigateToApp('discover'));

      it('generates a report with data', async () => {
        await PageObjects.discover.loadSavedSearch('Ecommerce Data');
        const fromTime = 'Apr 27, 2019 @ 23:56:51.374';
        const toTime = 'Aug 23, 2019 @ 16:18:51.821';
        await PageObjects.timePicker.setAbsoluteRange(fromTime, toTime);

        await PageObjects.reporting.openCsvReportingPanel();
        await PageObjects.reporting.clickGenerateReportButton();

        const url = await PageObjects.reporting.getReportURL(60000);
        const res = await PageObjects.reporting.getResponse(url);

        expect(res.status).to.equal(200);
        expect(res.get('content-type')).to.equal('text/csv; charset=utf-8');
        expectSnapshot(res.text).toMatch();
      });

      it('generates a report with filtered data', async () => {
        await PageObjects.discover.loadSavedSearch('Ecommerce Data');
        const fromTime = 'Apr 27, 2019 @ 23:56:51.374';
        const toTime = 'Aug 23, 2019 @ 16:18:51.821';
        await PageObjects.timePicker.setAbsoluteRange(fromTime, toTime);

        // filter and re-save
        await filterBar.addFilter('currency', 'is', 'EUR');
        await PageObjects.discover.saveSearch(`Ecommerce Data: EUR Filtered`);

        await PageObjects.reporting.openCsvReportingPanel();
        await PageObjects.reporting.clickGenerateReportButton();

        const url = await PageObjects.reporting.getReportURL(60000);
        const res = await PageObjects.reporting.getResponse(url);

        expect(res.status).to.equal(200);
        expect(res.get('content-type')).to.equal('text/csv; charset=utf-8');
        expectSnapshot(res.text).toMatch();
      });
    });
  });
}
