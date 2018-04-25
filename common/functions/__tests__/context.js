import expect from 'expect.js';
import { context } from '../context';
import { functionWrapper } from '../../../__tests__/helpers/function_wrapper';
import { testTable, emptyTable } from './fixtures/test_tables';

describe('context', () => {
  const fn = functionWrapper(context);

  it('returns whatever context you pass into', () => {
    expect(fn(null)).to.be(null);
    expect(fn(true)).to.be(true);
    expect(fn(1)).to.be(1);
    expect(fn('foo')).to.be('foo');
    expect(fn({})).to.eql({});
    expect(fn(emptyTable)).to.eql(emptyTable);
    expect(fn(testTable)).to.eql(testTable);
  });
});
