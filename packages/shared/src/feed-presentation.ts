export type FeedSignalTone = 'hot' | 'chat' | 'poll' | 'fresh' | 'seen';

export type FeedSignal = {
  label: string;
  tone: FeedSignalTone;
};

export type FeedPostInput = {
  commentsCount: number;
  createdAt?: string | number | Date;
  id: number;
  images?: readonly unknown[] | null;
  location?: {
    formattedAddress?: string | null;
    latitude?: number;
    longitude?: number;
    name?: string | null;
  } | null;
  points: number;
  poll?: { participantsCount?: number | null } | null;
  title: string;
};

export type FeedLiveUpdateInput = {
  id: string;
  occurredAt: string | number | Date | null;
  source: string;
  tags: readonly string[];
  title: string;
  url?: string;
};

export type FeedPulseMetrics = {
  comments: number;
  energyLabel: string;
  photos: number;
  places: number;
  polls: number;
  score: number;
  total: number;
};

export type FeedLiveLensItem = {
  id: number;
  meta: string;
  score: number;
  signalLabel: string;
  title: string;
  tone: FeedSignalTone;
};

export type FeedSceneStatus = 'quiet' | 'warming' | 'moving' | 'surging';

export type FeedSceneStatTone = 'pulse' | 'chat' | 'live' | 'media';

export type FeedSceneMoment = {
  id: string;
  kind: 'post' | 'live';
  meta: string;
  postId?: number;
  title: string;
  tone: FeedSignalTone | 'live';
  url?: string;
};

export type FeedSceneBoard = {
  headline: string;
  moments: FeedSceneMoment[];
  primaryActionLabel: string;
  primaryPostId?: number;
  stats: Array<{
    label: string;
    tone: FeedSceneStatTone;
    value: string;
  }>;
  status: FeedSceneStatus;
  statusLabel: string;
  subline: string;
};

const HOUR_MS = 60 * 60 * 1000;

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const getPostAgeHours = (
  post: FeedPostInput,
  now = Date.now(),
): number => {
  if (post.createdAt === undefined) return 0;
  const createdAt = new Date(post.createdAt).getTime();
  if (Number.isNaN(createdAt)) return 0;
  return Math.max(0, (now - createdAt) / HOUR_MS);
};

export const getPostPulseScore = (
  post: FeedPostInput,
  now = Date.now(),
): number => {
  const ageHours = getPostAgeHours(post, now);
  const freshnessBonus = ageHours <= 1 ? 18 : ageHours <= 6 ? 8 : 0;
  const mediaBonus = (post.images?.length ?? 0) > 0 ? 7 : 0;
  const pollBonus = post.poll !== null && post.poll !== undefined ? 9 : 0;
  const locationBonus =
    post.location !== null && post.location !== undefined ? 4 : 0;

  return (
    Math.max(0, post.points) * 2 +
    post.commentsCount * 3 +
    (post.poll?.participantsCount ?? 0) +
    freshnessBonus +
    mediaBonus +
    pollBonus +
    locationBonus
  );
};

export const getPostSignal = (
  post: FeedPostInput,
  now = Date.now(),
): FeedSignal => {
  const score = getPostPulseScore(post, now);
  const ageHours = getPostAgeHours(post, now);

  if (score >= 90) return { label: 'hot now', tone: 'hot' };
  if (post.commentsCount >= 8) return { label: 'chat moving', tone: 'chat' };
  if (post.poll !== null && post.poll !== undefined) {
    return { label: 'vote check', tone: 'poll' };
  }
  if (ageHours < 1) return { label: 'just dropped', tone: 'fresh' };
  return { label: 'seen nearby', tone: 'seen' };
};

export const getFeaturedFeedPost = <T extends FeedPostInput>(
  posts: readonly T[],
  now = Date.now(),
): T | undefined =>
  [...posts].sort(
    (a, b) => getPostPulseScore(b, now) - getPostPulseScore(a, now),
  )[0];

const getLiveLensMeta = (post: FeedPostInput): string => {
  if (post.commentsCount >= 2) {
    return `${pluralize(post.commentsCount, 'reply', 'replies')} moving`;
  }

  const pollVotes = post.poll?.participantsCount ?? 0;
  if (pollVotes > 0) return `${pluralize(pollVotes, 'vote')} live`;

  const photoCount = post.images?.length ?? 0;
  if (photoCount > 0) return `${pluralize(photoCount, 'photo')} drop`;

  if (post.location?.name !== undefined && post.location.name !== null) {
    return `near ${post.location.name}`;
  }

  return 'nearby signal';
};

export const getFeedLiveLensItems = (
  posts: readonly FeedPostInput[],
  now = Date.now(),
  limit = 4,
): FeedLiveLensItem[] =>
  [...posts]
    .sort((a, b) => {
      const scoreDiff = getPostPulseScore(b, now) - getPostPulseScore(a, now);
      return scoreDiff === 0 ? a.id - b.id : scoreDiff;
    })
    .slice(0, limit)
    .map((post) => {
      const signal = getPostSignal(post, now);

      return {
        id: post.id,
        meta: getLiveLensMeta(post),
        score: getPostPulseScore(post, now),
        signalLabel: signal.label,
        title: post.title,
        tone: signal.tone,
      };
    });

export const getFeedLiveLensHeading = ({
  total,
}: {
  total: number;
}): string => {
  if (total === 0) return 'No drops in range';
  return `${pluralize(total, 'drop')} in range`;
};

export const getFeedPulseMetrics = (
  posts: readonly FeedPostInput[],
  now = Date.now(),
): FeedPulseMetrics => {
  const score = posts.reduce(
    (total, post) => total + getPostPulseScore(post, now),
    0,
  );
  const comments = posts.reduce((total, post) => total + post.commentsCount, 0);
  const photos = posts.filter((post) => (post.images?.length ?? 0) > 0).length;
  const polls = posts.filter(
    (post) => post.poll !== null && post.poll !== undefined,
  ).length;
  const places = posts.filter(
    (post) => post.location !== null && post.location !== undefined,
  ).length;

  let energyLabel = 'quiet';
  if (score >= 160) energyLabel = 'surging';
  else if (score >= 72) energyLabel = 'lit up';
  else if (score >= 24) energyLabel = 'warming';

  return {
    comments,
    energyLabel,
    photos,
    places,
    polls,
    score,
    total: posts.length,
  };
};

export const getFeedHeroSummary = (metrics: FeedPulseMetrics): string => {
  if (metrics.total === 0) return 'The block is quiet right now.';

  return `${pluralize(metrics.total, 'post')}, ${pluralize(
    metrics.comments,
    'reply',
    'replies',
  )}, and ${pluralize(metrics.polls, 'live check')} near you.`;
};

const getLiveUpdateTime = (update: FeedLiveUpdateInput): number => {
  if (update.occurredAt === null) return 0;
  const time = new Date(update.occurredAt).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const getLiveUpdateMeta = (update: FeedLiveUpdateInput): string => {
  const source = update.source.toUpperCase();
  if (update.tags.length > 0) {
    return `${source} · ${update.tags.slice(0, 2).join(' / ')}`;
  }
  return `${source} nearby`;
};

const getSceneStatus = (score: number): FeedSceneStatus => {
  if (score >= 150) return 'surging';
  if (score >= 80) return 'moving';
  if (score > 0) return 'warming';
  return 'quiet';
};

const SCENE_STATUS_LABELS: Record<FeedSceneStatus, string> = {
  moving: 'moving',
  quiet: 'quiet',
  surging: 'surging',
  warming: 'warming',
};

const getSceneHeadline = (
  status: FeedSceneStatus,
  posts: readonly FeedPostInput[],
  liveUpdates: readonly FeedLiveUpdateInput[],
): string => {
  if (posts.length === 0 && liveUpdates.length === 0) {
    return 'Nothing nearby yet';
  }
  if (status === 'surging' || status === 'moving') {
    return 'People are posting nearby';
  }
  if (liveUpdates.length > 0) return 'X is talking nearby';
  return 'Something is starting nearby';
};

const getSceneSubline = (
  metrics: FeedPulseMetrics,
  liveUpdates: readonly FeedLiveUpdateInput[],
): string => {
  if (metrics.total === 0 && liveUpdates.length === 0) {
    return 'Post first or open the map to see what is close.';
  }

  return `${pluralize(metrics.total, 'drop')}, ${pluralize(
    metrics.comments,
    'reply',
    'replies',
  )}, and ${pluralize(liveUpdates.length, 'X mention')} nearby.`;
};

export const getFeedSceneBoard = (
  posts: readonly FeedPostInput[],
  liveUpdates: readonly FeedLiveUpdateInput[],
  now = Date.now(),
): FeedSceneBoard => {
  const metrics = getFeedPulseMetrics(posts, now);
  const featuredPost = getFeaturedFeedPost(posts, now);
  const sceneScore = metrics.score + liveUpdates.length * 16;
  const status = getSceneStatus(sceneScore);
  const postMoments: FeedSceneMoment[] = getFeedLiveLensItems(
    posts,
    now,
    3,
  ).map((item) => ({
    id: `post-${item.id}`,
    kind: 'post',
    meta: item.meta,
    postId: item.id,
    title: item.title,
    tone: item.tone,
  }));
  const liveMoments: FeedSceneMoment[] = [...liveUpdates]
    .sort((left, right) => getLiveUpdateTime(right) - getLiveUpdateTime(left))
    .slice(0, 2)
    .map((update) => ({
      id: `live-${update.id}`,
      kind: 'live',
      meta: getLiveUpdateMeta(update),
      title: update.title,
      tone: 'live',
      url: update.url,
    }));

  return {
    headline: getSceneHeadline(status, posts, liveUpdates),
    moments: [
      ...postMoments.slice(0, 1),
      ...liveMoments.slice(0, 1),
      ...postMoments.slice(1),
      ...liveMoments.slice(1),
    ].slice(0, 4),
    primaryActionLabel:
      featuredPost === undefined ? 'Post first' : 'Open top post',
    primaryPostId: featuredPost?.id,
    stats: [
      {
        label: 'activity',
        tone: 'pulse',
        value: sceneScore.toString(),
      },
      {
        label: 'replies',
        tone: 'chat',
        value: metrics.comments.toString(),
      },
      {
        label: 'X live',
        tone: 'live',
        value: liveUpdates.length.toString(),
      },
      {
        label: 'photos',
        tone: 'media',
        value: metrics.photos.toString(),
      },
    ],
    status,
    statusLabel: SCENE_STATUS_LABELS[status],
    subline: getSceneSubline(metrics, liveUpdates),
  };
};
