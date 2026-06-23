import { Radio } from 'lucide-react';
import { type CreateDraftMetrics } from './create-presentation';

export const DraftReadiness = ({
  metrics,
  validationError,
}: {
  metrics: CreateDraftMetrics;
  validationError: string | null;
}) => (
  <div className={`draft-readiness is-${metrics.readinessTone}`}>
    <Radio />
    <span>
      <strong>{metrics.readinessLabel}</strong>
      <em>{validationError ?? 'Looks good for the nearby feed.'}</em>
    </span>
  </div>
);
