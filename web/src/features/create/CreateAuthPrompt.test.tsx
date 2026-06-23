import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CreateAuthPrompt } from './CreateAuthPrompt';

describe('CreateAuthPrompt', () => {
  afterEach(() => {
    cleanup();
  });

  it('turns signed-out posting into a live drop invitation', () => {
    const setView = vi.fn();

    render(<CreateAuthPrompt setView={setView} />);

    expect(
      screen.getByRole('heading', {
        name: 'Drop what is happening before it hits the feed.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Ramen line forming')).toBeInTheDocument();
    expect(screen.getByText('200m radius')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sign in to post' }));
    fireEvent.click(screen.getByRole('button', { name: 'Watch the map' }));

    expect(setView).toHaveBeenNthCalledWith(1, 'profile');
    expect(setView).toHaveBeenNthCalledWith(2, 'map');
  });
});
