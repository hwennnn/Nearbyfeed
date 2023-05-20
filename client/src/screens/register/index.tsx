import React from 'react';

import { useRegister } from '@/api/auth';
import { useAuth } from '@/core';

import type { RegisterFormProps } from './register-form';
import { RegisterForm } from './register-form';

export const Register = () => {
  const { isLoading, error, mutateAsync: mutateRegister } = useRegister();
  const signIn = useAuth.use.signIn();

  console.log(isLoading, error);

  const onSubmit: RegisterFormProps['onSubmit'] = async (data) => {
    const token = await mutateRegister(data);

    signIn({ access: token.accessToken, refresh: token.refreshToken });
  };

  return (
    <RegisterForm onSubmit={onSubmit} isLoading={isLoading} error={error} />
  );
};
