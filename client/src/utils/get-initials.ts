export const getInitials = (username: string): string => {
  const words = username.split(' ');

  if (words.length === 1) {
    // If the username contains only one word
    // Return the first two characters of the word
    return words[0][0].toUpperCase();
  } else if (words.length > 1) {
    // If the username contains multiple words
    // Concatenate the first character of each word
    return words
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  // Return an empty string if the username is empty
  return '';
};
