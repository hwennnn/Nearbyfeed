import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProfileTabs } from './ProfileTabs';

describe('ProfileTabs', () => {
  it('keeps icon-only mobile tabs accessible by name', () => {
    const onChange = vi.fn();

    render(<ProfileTabs activeTab="posts" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Muted' }));

    expect(onChange).toHaveBeenCalledWith('blocked');
  });
});
