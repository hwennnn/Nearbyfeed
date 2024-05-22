import * as FileSystem from 'expo-file-system';

export const checkFileSize = async (
  fileURI: string
): Promise<number | null> => {
  const file = await FileSystem.getInfoAsync(fileURI);

  if (!file.exists) return null;

  return file.size;
};
