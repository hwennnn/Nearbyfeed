export type Coordinates = {
  latitude: number;
  longitude: number;
};

export const DISTANCE_OPTIONS_METERS = [200, 500, 1000] as const;
export type DistanceMeters = (typeof DISTANCE_OPTIONS_METERS)[number];
export const DEFAULT_DISTANCE_METERS: DistanceMeters = 200;

export const PAGE_SIZE = {
  default: 15,
  min: 15,
  max: 25,
} as const;

export const COMMENT_SORT = {
  LATEST: 'latest',
  OLDEST: 'oldest',
  TOP: 'top',
} as const;

export type CommentSort = (typeof COMMENT_SORT)[keyof typeof COMMENT_SORT];

export const DEFAULT_COMMENT_SORT: CommentSort = COMMENT_SORT.TOP;

export const COMMENT_SORT_OPTIONS = [
  { value: COMMENT_SORT.TOP, label: 'Top' },
  { value: COMMENT_SORT.LATEST, label: 'Newest' },
  { value: COMMENT_SORT.OLDEST, label: 'Oldest' },
] as const;

export const COMMENT_SORT_VALUES = COMMENT_SORT_OPTIONS.map(
  (option) => option.value,
) as CommentSort[];

export const isCommentSort = (value: string): value is CommentSort =>
  COMMENT_SORT_VALUES.includes(value as CommentSort);

export const TIME_WINDOW_OPTIONS = [
  { value: '2h', label: 'Now', hours: 2 },
  { value: '24h', label: 'Today', hours: 24 },
  { value: '7d', label: 'This week', hours: 24 * 7 },
  { value: '30d', label: 'This month', hours: 24 * 30 },
] as const;

export type TimeWindow = (typeof TIME_WINDOW_OPTIONS)[number]['value'];
export const DEFAULT_TIME_WINDOW: TimeWindow = '24h';
export const TIME_WINDOW_VALUES = TIME_WINDOW_OPTIONS.map(
  (option) => option.value,
) as TimeWindow[];

export const ReportReason = {
  SPAM: 'SPAM',
  HARASSMENT_OR_BULLYING: 'HARASSMENT_OR_BULLYING',
  HATE_SPEECH: 'HATE_SPEECH',
  VIOLENCE_OR_THREATS: 'VIOLENCE_OR_THREATS',
  INAPPROPRIATE_CONTENT: 'INAPPROPRIATE_CONTENT',
  FALSE_INFORMATION: 'FALSE_INFORMATION',
  COPYRIGHT_INFRINGEMENT: 'COPYRIGHT_INFRINGEMENT',
  PRIVACY_VIOLATION: 'PRIVACY_VIOLATION',
  SELF_HARM_OR_SUICIDE: 'SELF_HARM_OR_SUICIDE',
  TERRORISM_OR_EXTREMISM: 'TERRORISM_OR_EXTREMISM',
} as const;

export type ReportReason = (typeof ReportReason)[keyof typeof ReportReason];

export const REPORT_REASON_OPTIONS = [
  {
    value: ReportReason.SPAM,
    label: 'Spam',
    detail: 'Repeated posts, scams, or low-signal promotion.',
  },
  {
    value: ReportReason.HARASSMENT_OR_BULLYING,
    label: 'Harassment or bullying',
    detail: 'Targeted attacks, intimidation, or unwanted pressure.',
  },
  {
    value: ReportReason.HATE_SPEECH,
    label: 'Hate speech',
    detail: 'Attacks on protected identity or dehumanizing language.',
  },
  {
    value: ReportReason.VIOLENCE_OR_THREATS,
    label: 'Violence or threats',
    detail: 'Threats, weaponized language, or credible danger.',
  },
  {
    value: ReportReason.INAPPROPRIATE_CONTENT,
    label: 'Inappropriate content',
    detail: 'Sexual, graphic, or otherwise unsafe local content.',
  },
  {
    value: ReportReason.FALSE_INFORMATION,
    label: 'False information',
    detail: 'Misleading claims about something happening nearby.',
  },
  {
    value: ReportReason.COPYRIGHT_INFRINGEMENT,
    label: 'Copyright infringement',
    detail: 'Someone posted content they do not have rights to share.',
  },
  {
    value: ReportReason.PRIVACY_VIOLATION,
    label: 'Privacy violation',
    detail: 'Personal info, doxxing, or unwanted exposure.',
  },
  {
    value: ReportReason.SELF_HARM_OR_SUICIDE,
    label: 'Self-harm or suicide',
    detail: 'Someone may be at risk or encouraging self-harm.',
  },
  {
    value: ReportReason.TERRORISM_OR_EXTREMISM,
    label: 'Terrorism or extremism',
    detail: 'Violent extremism, recruitment, or praise.',
  },
] as const;

export const REPORT_REASON_VALUES = REPORT_REASON_OPTIONS.map(
  (option) => option.value,
) as ReportReason[];

export const isReportReason = (value: string): value is ReportReason =>
  REPORT_REASON_VALUES.includes(value as ReportReason);

export const POST_LIMITS = {
  titleMin: 4,
  titleMax: 70,
  contentMin: 15,
  contentMax: 1000,
  commentMin: 2,
  commentMax: 1000,
  pollOptionMin: 1,
  pollOptionMax: 70,
  pollOptionsMin: 2,
  pollOptionsMax: 7,
} as const;

export type CreatePostValidationInput = {
  title: string;
  content?: string;
  pollEnabled?: boolean;
  pollOptions?: string[];
};

export const getCreatePostValidationError = ({
  content,
  pollEnabled = false,
  pollOptions = [],
  title,
}: CreatePostValidationInput): string | null => {
  const titleLength = title.trim().length;
  const contentLength = content?.trim().length ?? 0;
  const options = pollOptions.map((option) => option.trim());
  const filledOptions = options.filter((option) => option.length > 0);

  if (titleLength < POST_LIMITS.titleMin) {
    return `Title needs at least ${POST_LIMITS.titleMin} characters.`;
  }

  if (titleLength > POST_LIMITS.titleMax) {
    return `Title must stay under ${POST_LIMITS.titleMax} characters.`;
  }

  if (contentLength > 0 && contentLength < POST_LIMITS.contentMin) {
    return `Context needs at least ${POST_LIMITS.contentMin} characters or can be blank.`;
  }

  if (contentLength > POST_LIMITS.contentMax) {
    return `Context must stay under ${POST_LIMITS.contentMax} characters.`;
  }

  if (!pollEnabled) return null;

  if (filledOptions.length < POST_LIMITS.pollOptionsMin) {
    return `Poll needs at least ${POST_LIMITS.pollOptionsMin} options.`;
  }

  if (filledOptions.length > POST_LIMITS.pollOptionsMax) {
    return `Poll can have at most ${POST_LIMITS.pollOptionsMax} options.`;
  }

  const hasInvalidOption = filledOptions.some(
    (option) =>
      option.length < POST_LIMITS.pollOptionMin ||
      option.length > POST_LIMITS.pollOptionMax,
  );

  return hasInvalidOption
    ? `Each poll option must stay between ${POST_LIMITS.pollOptionMin} and ${POST_LIMITS.pollOptionMax} characters.`
    : null;
};

export const canCreatePost = (input: CreatePostValidationInput): boolean =>
  getCreatePostValidationError(input) === null;

export type CreateCommentValidationInput = {
  content: string;
};

export const getCreateCommentValidationError = ({
  content,
}: CreateCommentValidationInput): string | null => {
  const length = content.trim().length;

  if (length < POST_LIMITS.commentMin) {
    return `Comment needs at least ${POST_LIMITS.commentMin} characters.`;
  }

  if (length > POST_LIMITS.commentMax) {
    return `Comment must stay under ${POST_LIMITS.commentMax} characters.`;
  }

  return null;
};

export const canCreateComment = (
  input: CreateCommentValidationInput,
): boolean => getCreateCommentValidationError(input) === null;

const EARTH_RADIUS_METERS = 6371008.8;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

export const isAllowedDistanceMeters = (
  value: number,
): value is DistanceMeters =>
  DISTANCE_OPTIONS_METERS.includes(value as DistanceMeters);

export const isValidPageSize = (value: number): boolean =>
  Number.isInteger(value) && value >= PAGE_SIZE.min && value <= PAGE_SIZE.max;

export const isTimeWindow = (value: string): value is TimeWindow =>
  TIME_WINDOW_VALUES.includes(value as TimeWindow);

export const resolveTimeWindow = (value?: TimeWindow): TimeWindow =>
  value ?? DEFAULT_TIME_WINDOW;

export const getTimeWindowStart = (
  value: TimeWindow,
  now: Date = new Date(),
): Date => {
  const option = TIME_WINDOW_OPTIONS.find((item) => item.value === value);
  const hours = option?.hours ?? TIME_WINDOW_OPTIONS[1].hours;

  return new Date(now.getTime() - hours * 60 * 60 * 1000);
};

export const calculateDistanceMeters = (
  from: Coordinates,
  to: Coordinates,
): number => {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
};

export const isWithinDistanceMeters = (
  from: Coordinates,
  to: Coordinates,
  distanceMeters: number,
): boolean => calculateDistanceMeters(from, to) <= distanceMeters;

export const getBoundingBox = (
  center: Coordinates,
  radiusMeters: number,
): {
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
} => {
  const latitudeDelta = toDegrees(radiusMeters / EARTH_RADIUS_METERS);
  const latitudeRadians = toRadians(center.latitude);
  const longitudeDelta =
    Math.abs(Math.cos(latitudeRadians)) < 0.000001
      ? 180
      : toDegrees(
          radiusMeters / (EARTH_RADIUS_METERS * Math.cos(latitudeRadians)),
        );

  return {
    minLatitude: Math.max(center.latitude - latitudeDelta, -90),
    maxLatitude: Math.min(center.latitude + latitudeDelta, 90),
    minLongitude: Math.max(center.longitude - longitudeDelta, -180),
    maxLongitude: Math.min(center.longitude + longitudeDelta, 180),
  };
};

export const formatDistanceMeters = (distance: DistanceMeters): string =>
  distance === 1000 ? '1km' : `${distance}m`;

export const formatInitials = (
  value?: string | null,
  fallback = '',
): string => {
  const words =
    value
      ?.trim()
      .split(/\s+/)
      .filter(Boolean) ?? [];

  if (words.length === 0) return fallback;

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return words
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const formatSingularPlural = ({
  empty,
  plural,
  singular,
  value,
}: {
  empty: string;
  plural: string;
  singular: string;
  value: number;
}): string => {
  if (value === 0) return empty;
  return `${value} ${value === 1 ? singular : plural}`;
};

export type PollOptionResultInput = {
  id: number;
  order: number;
  text: string;
  voteCount: number;
};

export type PollOptionResult<
  T extends PollOptionResultInput = PollOptionResultInput,
> = T & {
  isLeader: boolean;
  percentage: number;
};

export const getPollVotePercentage = (
  voteCount: number,
  participantCount: number,
): number => {
  if (participantCount <= 0 || voteCount <= 0) return 0;
  return Math.min(100, Math.round((voteCount / participantCount) * 100));
};

export const getPollOptionResults = <T extends PollOptionResultInput>(
  options: T[],
  participantCount: number,
  {
    limit,
    sortByVotes = false,
  }: {
    limit?: number;
    sortByVotes?: boolean;
  } = {},
): Array<PollOptionResult<T>> => {
  const safeParticipantCount = Math.max(0, participantCount);
  const orderedOptions = [...options].sort((left, right) => {
    if (!sortByVotes) return left.order - right.order;

    const voteDiff = right.voteCount - left.voteCount;
    return voteDiff === 0 ? left.order - right.order : voteDiff;
  });
  const visibleOptions =
    limit === undefined ? orderedOptions : orderedOptions.slice(0, limit);
  const leaderVoteCount = orderedOptions[0]?.voteCount ?? 0;

  return visibleOptions.map((option) => ({
    ...option,
    isLeader:
      safeParticipantCount > 0 && option.voteCount === leaderVoteCount,
    percentage: getPollVotePercentage(option.voteCount, safeParticipantCount),
  }));
};

export const formatPollVoteCount = (participantCount: number): string =>
  formatSingularPlural({
    empty: '0 votes',
    plural: 'votes',
    singular: 'vote',
    value: Math.max(0, participantCount),
  });

export const addDays = (date: Date | string, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const formatRelativeCompactTime = (
  value: Date | string,
  now: Date = new Date(),
): string => {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'Just now';

  const timeDiff = Math.abs(now.getTime() - timestamp);
  const seconds = Math.floor(timeDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (years > 0) return `${years}y`;
  if (months > 0) return `${months}mo`;
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 5) return `${minutes}m`;

  return 'Just now';
};

export const formatRelativeFullTime = (
  value: Date | string,
  now: Date = new Date(),
): string => {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'minutes';

  const timeDiff = Math.abs(now.getTime() - timestamp);
  const seconds = Math.floor(timeDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (years > 0) {
    return formatSingularPlural({
      empty: 'years',
      plural: 'years',
      singular: 'year',
      value: years,
    });
  }

  if (months > 0) {
    return formatSingularPlural({
      empty: 'months',
      plural: 'months',
      singular: 'month',
      value: months,
    });
  }

  if (days > 0) {
    return formatSingularPlural({
      empty: 'days',
      plural: 'days',
      singular: 'day',
      value: days,
    });
  }

  if (hours > 0) {
    return formatSingularPlural({
      empty: 'hours',
      plural: 'hours',
      singular: 'hour',
      value: hours,
    });
  }

  return formatSingularPlural({
    empty: 'minutes',
    plural: 'minutes',
    singular: 'minute',
    value: minutes,
  });
};
