import type { AxiosError } from 'axios';
import { showMessage } from 'react-native-flash-message';

export const showSuccessMessage = (message: string) => {
  showMessage({
    message,
    type: 'success',
    duration: 4000,
  });
};

// for onError react queries and mutations
export const showError = (error: AxiosError) => {
  const description = extractError(error?.response?.data).trimEnd();

  showMessage({
    message: 'Error',
    description,
    type: 'danger',
    duration: 4000,
    icon: 'danger',
  });
};

export const showErrorMessage = (message: string = 'Something went wrong') => {
  showMessage({
    message,
    type: 'danger',
    duration: 4000,
  });
};

export const showNoConnectionMessage = () => {
  showMessage({
    message: 'No internet connection',
    type: 'danger',
    autoHide: false,
    hideOnPress: false,
  });
};

export const extractError = (data: unknown): string => {
  if (typeof data === 'string') {
    return data;
  }
  if (Array.isArray(data)) {
    const messages = data.map((item) => {
      return `  ${extractError(item)}`;
    });

    return `${messages.join('')}`;
  }

  if (typeof data === 'object' && data !== null) {
    const messages = Object.entries(data).map((item) => {
      const [key, value] = item;
      const separator = Array.isArray(value) ? ':\n ' : ': ';

      return `- ${key}${separator}${extractError(value)} \n `;
    });
    return `${messages.join('')} `;
  }
  return 'Something went wrong';
};
