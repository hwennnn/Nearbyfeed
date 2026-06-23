export type ProfileAuthMode = 'login' | 'register';

export type ProfileAuthExperience = {
  ctaLabel: string;
  heading: string;
  kicker: string;
  previewCards: Array<{
    label: string;
    meta: string;
    title: string;
  }>;
  switchLabel: string;
  toneLabel: string;
};

export const getProfileAuthExperience = (
  mode: ProfileAuthMode,
): ProfileAuthExperience =>
  mode === 'login'
    ? {
        ctaLabel: 'Enter the pulse',
        heading: 'Pull up where it is happening',
        kicker: 'Your nearby feed, map drops, and thread receipts stay tied to your handle.',
        previewCards: [
          {
            label: 'just now',
            meta: '92m away',
            title: 'DJ set under the market lights',
          },
          {
            label: 'vote check',
            meta: '11 people in',
            title: 'Worth the ramen line?',
          },
          {
            label: 'heads up',
            meta: 'live map',
            title: 'Pop-up court is moving fast',
          },
        ],
        switchLabel: 'Make a new handle',
        toneLabel: 'live identity',
      }
    : {
        ctaLabel: 'Reserve handle',
        heading: 'Claim your local signal',
        kicker: 'Start posting what only people near you can actually use right now.',
        previewCards: [
          {
            label: 'handle',
            meta: 'reserved',
            title: '@you near the action',
          },
          {
            label: 'first post',
            meta: '200m radius',
            title: 'Drop the thing everyone should see',
          },
          {
            label: 'thread',
            meta: 'nearby only',
            title: 'Turn a moment into a meetup',
          },
        ],
        switchLabel: 'I already have one',
        toneLabel: 'new signal',
      };
