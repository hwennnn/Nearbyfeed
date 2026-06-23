import { ChevronDown, ChevronUp } from 'lucide-react';

export const MapPanelSheetToggle = ({
  isCollapsed,
  onToggle,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
}) => {
  const Icon = isCollapsed ? ChevronUp : ChevronDown;

  return (
    <button
      aria-controls="map-panel-live-stack"
      aria-expanded={!isCollapsed}
      aria-label={isCollapsed ? 'Expand live sheet' : 'Collapse live sheet'}
      className="map-panel-toggle"
      onClick={onToggle}
      type="button"
    >
      <span aria-hidden="true" className="map-panel-toggle-grabber" />
      <span>{isCollapsed ? 'Show live stack' : 'More map'}</span>
      <Icon />
    </button>
  );
};
