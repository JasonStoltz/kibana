/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

jest.mock('react', () => ({
  ...(jest.requireActual('react') as object),
  useState: jest.fn(),
}));

// This import uses * in order to spy on React.useState
import * as React from 'react';

import { shallow, ShallowWrapper } from 'enzyme';

import { EuiButton, EuiButtonEmpty, EuiFlyout, EuiFlyoutBody } from '@elastic/eui';

import { rerender } from '../../../../../test_helpers';

import { AddDomainFlyout } from './add_domain_flyout';
import { AddDomainForm } from './add_domain_form';
import { AddDomainFormErrors } from './add_domain_form_errors';
import { AddDomainFormSubmitButton } from './add_domain_form_submit_button';

describe('AddDomainFlyout', () => {
  const mockSetState = jest.fn();
  const mockUseState = jest.fn((initState) => [initState, mockSetState]);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(React, 'useState').mockImplementation(mockUseState as any);
  });

  it('is hidden by default', () => {
    const wrapper = shallow(<AddDomainFlyout />);

    expect(mockUseState).toHaveBeenCalledWith(false);
    expect(wrapper.find(EuiFlyout)).toHaveLength(0);
  });

  it('displays the flyout when the button is pressed', () => {
    const wrapper = shallow(<AddDomainFlyout />);

    wrapper.find(EuiButton).simulate('click');

    expect(mockSetState).toHaveBeenCalledWith(true);

    mockUseState.mockReturnValueOnce([true, mockSetState]);
    rerender(wrapper);

    expect(wrapper.find(EuiFlyout)).toHaveLength(1);
  });

  describe('flyout', () => {
    let wrapper: ShallowWrapper;

    beforeEach(() => {
      mockUseState.mockReturnValueOnce([true, mockSetState]);
      wrapper = shallow(<AddDomainFlyout />);
    });

    it('displays form errors', () => {
      expect(wrapper.find(EuiFlyoutBody).dive().find(AddDomainFormErrors)).toHaveLength(1);
    });

    it('contains a form to add domains', () => {
      expect(wrapper.find(AddDomainForm)).toHaveLength(1);
    });

    it('contains a cancel buttonn', () => {
      wrapper.find(EuiButtonEmpty).simulate('click');
      expect(mockSetState).toHaveBeenCalledWith(false);
    });

    it('contains a submit button', () => {
      expect(wrapper.find(AddDomainFormSubmitButton)).toHaveLength(1);
    });

    it('hides the flyout on close', () => {
      wrapper.find(EuiFlyout).simulate('close');

      expect(mockSetState).toHaveBeenCalledWith(false);

      mockUseState.mockReturnValueOnce([false, mockSetState]);
      rerender(wrapper);

      expect(wrapper.find(EuiFlyout)).toHaveLength(0);
    });
  });
});
