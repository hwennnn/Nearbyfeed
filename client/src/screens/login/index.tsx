import React from 'react';

import { useLogin } from '@/api/auth/login';
import { useAuth } from '@/core';

import type { LoginFormProps } from './login-form';
import { LoginForm } from './login-form';

export const Login = () => {
  const { isLoading, error, mutateAsync: mutateLogin } = useLogin();

  const signIn = useAuth.use.signIn();

  const onSubmit: LoginFormProps['onSubmit'] = async (data) => {
    const token = await mutateLogin(data);

    signIn({ access: token.accessToken, refresh: token.refreshToken });
  };

  return <LoginForm onSubmit={onSubmit} isLoading={isLoading} error={error} />;
};
