import dateFormat from 'dateformat';

import { stringUtils } from '@/utils/string-utils';

const getCurrentTimeInMs = (): number => {
  return new Date().getTime();
};

const formatDateStringToMonthYear = (dateString: any): string => {
  const date = new Date(dateString);

  return dateFormat(date, 'mmm yyyy');
};

const formatDateStringToDateMonthYear = (dateString: any): string => {
  const date = new Date(dateString);

  return dateFormat(date, 'dd mmm yyyy');
};

const formatCreatedTime = (createdTime: Date, currentTime?: Date): string => {
  currentTime ??= new Date();
  const timeDiff = Math.abs(currentTime.getTime() - createdTime.getTime());
  const seconds = Math.floor(timeDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (years > 0) {
    return `${years}y`;
  } else if (months > 0) {
    return `${months}mo`;
  } else if (days > 0) {
    return `${days}d`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else if (minutes > 5) {
    return `${minutes}m`;
  } else {
    return `Just now`;
  }
};

const formatCreatedTimeInFull = (
  createdTime: Date,
  currentTime?: Date
): string => {
  currentTime ??= new Date();
  const timeDiff = Math.abs(currentTime.getTime() - createdTime.getTime());
  const seconds = Math.floor(timeDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (years > 0) {
    return stringUtils.formatSingularPlural('year', 'years', 'years', years);
  } else if (months > 0) {
    return stringUtils.formatSingularPlural(
      'month',
      'months',
      'months',
      months
    );
  } else if (days > 0) {
    return stringUtils.formatSingularPlural('day', 'days', 'days', days);
  } else if (hours > 0) {
    return stringUtils.formatSingularPlural('hour', 'hours', 'hours', hours);
  } else {
    return stringUtils.formatSingularPlural(
      'minute',
      'minutes',
      'minutes',
      minutes
    );
  }
};

const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);

  return d;
};

const formatCountdownTime = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
};

const timeUtils = {
  getCurrentTimeInMs,
  formatDateStringToMonthYear,
  formatDateStringToDateMonthYear,
  formatCreatedTime,
  formatCreatedTimeInFull,
  formatCountdownTime,
  addDays,
};

export { timeUtils };
