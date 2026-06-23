import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FeedLocationCard } from './FeedLocationCard';

describe('FeedLocationCard', () => {
  it('links place cards to maps using the post coordinates', () => {
    render(
      <FeedLocationCard
        location={{
          formattedAddress: '5100 N Francisco Ave, Chicago, IL',
          latitude: 41.9742,
          longitude: -87.7019,
          name: 'River Park',
        }}
      />,
    );

    const link = screen.getByRole('link', { name: 'Open River Park in maps' });

    expect(link).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=41.9742%2C-87.7019',
    );
    expect(screen.getByText('Pinned place')).toBeInTheDocument();
    expect(screen.getByText('5100 N Francisco Ave, Chicago, IL')).toBeInTheDocument();
    expect(screen.getByText('41.9742, -87.7019')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });
});
