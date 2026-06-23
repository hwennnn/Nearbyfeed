import { describe, expect, it } from 'vitest';
import { getProfileAuthExperience } from './profile-auth-presentation';

describe('profile auth presentation', () => {
  it('builds a direct login experience for returning users', () => {
    expect(getProfileAuthExperience('login')).toMatchObject({
      ctaLabel: 'Enter the pulse',
      heading: 'Pull up where it is happening',
      switchLabel: 'Make a new handle',
      toneLabel: 'live identity',
    });
  });

  it('builds a handle creation experience for new users', () => {
    expect(getProfileAuthExperience('register')).toMatchObject({
      ctaLabel: 'Reserve handle',
      heading: 'Claim your local signal',
      switchLabel: 'I already have one',
      toneLabel: 'new signal',
    });
  });
});
