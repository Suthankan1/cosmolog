import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Icon } from '../src/components/common/Icon';

describe('Icon component', () => {
  it('renders a Feather icon with specified name and accessibilityLabel', async () => {
    await render(
      <Icon name="compass" size={24} accessibilityLabel="Discover icon" />
    );
    expect(screen.getByLabelText('Discover icon')).toBeTruthy();
  });
});
