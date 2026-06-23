import { useEffect } from 'react';
import { type View } from '../app-types';
import { resetViewScrollPosition } from '../lib/view-scroll';

export const useViewScrollReset = ({
  selectedPostId,
  view,
}: {
  selectedPostId: number | null;
  view: View;
}) => {
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      resetViewScrollPosition();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedPostId, view]);
};
