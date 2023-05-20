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

const timeUtils = {
  getCurrentTimeInMs,
  formatDateStringToMonthYear,
  formatDateStringToDateMonthYear,
};

export { timeUtils };
