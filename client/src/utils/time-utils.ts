import dateFormat from 'dateformat';

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

const formatCreatedTime = (createdTime: Date): string => {
  const currentTime = new Date();
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
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
};

const timeUtils = {
  getCurrentTimeInMs,
  formatDateStringToMonthYear,
  formatDateStringToDateMonthYear,
  formatCreatedTime,
};

export { timeUtils };
