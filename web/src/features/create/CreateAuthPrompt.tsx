import {
  ArrowRight,
  Flame,
  Map,
  MapPin,
  Radio,
  Sparkles,
  Vote,
} from 'lucide-react';
import { type View } from '../../app-types';

export const CreateAuthPrompt = ({
  setView,
}: {
  setView: (view: View) => void;
}) => (
  <section className="create-auth-scene" aria-label="Signed out post composer">
    <div className="create-auth-copy">
      <span className="create-auth-kicker">
        <Sparkles />
        live drop access
      </span>
      <h1>Drop what is happening before it hits the feed.</h1>
      <p>
        Your handle keeps posts, polls, and receipts tied to you while the block
        is moving.
      </p>
      <div className="create-auth-actions">
        <button
          className="primary-button"
          onClick={() => setView('profile')}
          type="button"
        >
          Sign in to post
          <ArrowRight />
        </button>
        <button
          className="map-command-button"
          onClick={() => setView('map')}
          type="button"
        >
          <Map />
          Watch the map
        </button>
      </div>
    </div>

    <div className="create-auth-drop-deck" aria-label="Live drop preview">
      <div className="create-auth-ticket is-hot">
        <span>
          <Flame />
          hot nearby
        </span>
        <strong>Ramen line forming</strong>
        <em>14 people watching</em>
      </div>
      <div className="create-auth-ticket is-poll">
        <span>
          <Vote />
          vote check
        </span>
        <strong>Worth the wait?</strong>
        <em>200m radius</em>
      </div>
      <div className="create-auth-map-strip">
        <span>
          <MapPin />
          Cupertino Car Wash
        </span>
        <strong>
          <Radio />
          live within 200m
        </strong>
      </div>
    </div>
  </section>
);
