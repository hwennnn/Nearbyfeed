import { useNavigation } from '@react-navigation/native';
import React from 'react';

import { useRegister } from '@/api/auth';

import type { RegisterFormProps } from './register-form';
import { RegisterForm } from './register-form';

export const Register = () => {
  const { isLoading, error, mutateAsync: mutateRegister } = useRegister();
  const { navigate } = useNavigation();

  const onSubmit: RegisterFormProps['onSubmit'] = async (data) => {
    const pendingUser = await mutateRegister(data);

    navigate('Auth', {
      screen: 'ValidateEmail',
      params: {
        email: pendingUser.email,
      },
    });
  };

  return (
    <RegisterForm onSubmit={onSubmit} isLoading={isLoading} error={error} />
  );
};
