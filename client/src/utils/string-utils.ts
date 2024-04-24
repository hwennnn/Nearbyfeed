const formatSingularPlural = (
  singularTerm: string,
  pluralTerm: string,
  emptyTerm: string,
  value: number
): string => {
  if (value === 0) return emptyTerm;

  return `${value} ${value === 1 ? singularTerm : pluralTerm}`;
};

const stringUtils = {
  formatSingularPlural,
};

export { stringUtils };
