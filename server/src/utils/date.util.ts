export const dayInMs = 86400000;
export const dayInSeconds = 86400;

export const isPollExpired = (createdTime: number, days: number): boolean => {
  const currentTime = Date.now();
  const expirationTime = createdTime + days * dayInMs;

  return currentTime >= expirationTime;
};
