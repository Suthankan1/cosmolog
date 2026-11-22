import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SearchBar } from '../src/components/discovery/SearchBar';

describe('SearchBar Component', () => {
  it('renders input with placeholder', async () => {
    await render(<SearchBar value="" onChangeText={jest.fn()} />);

    expect(screen.getByPlaceholderText('Search celestial observations...')).toBeTruthy();
  });

  it('renders clear button when value is non-empty and triggers clear', async () => {
    const onClearMock = jest.fn();
    const onChangeTextMock = jest.fn();

    await render(
      <SearchBar
        value="Jupiter"
        onChangeText={onChangeTextMock}
        onClear={onClearMock}
      />
    );

    const clearBtn = screen.getByLabelText('Clear search input');
    expect(clearBtn).toBeTruthy();

    fireEvent.press(clearBtn);
    expect(onClearMock).toHaveBeenCalledTimes(1);
  });
});
