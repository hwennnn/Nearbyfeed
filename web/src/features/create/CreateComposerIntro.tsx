import { Radio } from 'lucide-react';

export const CreateComposerIntro = ({ locationName }: { locationName: string }) => (
  <div className="composer-intro">
    <span>
      <Radio />
      live signal composer
    </span>
    <h1>Post what the block should know.</h1>
    <p>{locationName} will see it as a nearby pulse.</p>
  </div>
);
