import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommentSortControl } from './CommentSortControl';

describe('CommentSortControl', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the selected comment sort and switches thread order', () => {
    const onChange = vi.fn();

    render(<CommentSortControl onChange={onChange} value="top" />);

    expect(screen.getByRole('button', { name: 'Top' })).toHaveClass('is-selected');
    fireEvent.click(screen.getByRole('button', { name: 'Oldest' }));

    expect(onChange).toHaveBeenCalledWith('oldest');
  });
});
