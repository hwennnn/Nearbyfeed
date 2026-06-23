import { AudioLines, MapPin, Sparkles } from 'lucide-react';
import { type ProfileAuthExperience } from './profile-auth-presentation';

export const ProfileAuthScene = ({
  experience,
}: {
  experience: ProfileAuthExperience;
}) => (
  <aside className="auth-scene" aria-label="Nearby activity preview">
    <div className="auth-scene-heading">
      <span className="auth-tone-chip">
        <AudioLines />
        {experience.toneLabel}
      </span>
      <h2>{experience.heading}</h2>
      <p>{experience.kicker}</p>
    </div>

    <div className="auth-signal-orbit" aria-hidden="true">
      <div className="auth-map-plate">
        <span className="auth-map-dot" />
        <span className="auth-map-ring" />
        <MapPin />
      </div>
      {experience.previewCards.map((card, index) => (
        <div
          className={`auth-float-card auth-float-card-${index + 1}`}
          key={card.title}
        >
          <span>{card.label}</span>
          <strong>{card.title}</strong>
          <em>{card.meta}</em>
        </div>
      ))}
    </div>

    <div className="auth-scene-foot">
      <Sparkles />
      <span>200m radius</span>
      <span>map-first</span>
      <span>live threads</span>
    </div>
  </aside>
);
