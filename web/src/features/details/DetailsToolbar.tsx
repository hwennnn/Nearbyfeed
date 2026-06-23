import { SlidersHorizontal } from 'lucide-react';

export const DetailsToolbar = ({
  backLabel,
  onBack,
}: {
  backLabel: string;
  onBack: () => void;
}) => (
  <div className="details-toolbar">
    <button className="text-command" onClick={onBack}>
      Back
    </button>
    <strong>{backLabel}</strong>
    <button className="icon-button" title="More">
      <SlidersHorizontal />
    </button>
  </div>
);
