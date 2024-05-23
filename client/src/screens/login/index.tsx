import React from 'react';

import { useLogin } from '@/api/auth';
import { useAuth } from '@/core';
import { setUser } from '@/core/user';
import { Layout } from '@/ui/core/layout';

import type { LoginFormProps } from './login-form';
import { LoginForm } from './login-form';

export const Login = () => {
  const { isLoading, error, mutateAsync: mutateLogin } = useLogin();

  const signIn = useAuth.use.signIn();

  const onSubmit: LoginFormProps['onSubmit'] = async (data) => {
    const result = await mutateLogin(data);
    const tokens = result.tokens;

    signIn(tokens);
    setUser(result.user);
  };

  return (
    <Layout className="flex-1" verticalPadding={0}>
      <LoginForm onSubmit={onSubmit} isLoading={isLoading} error={error} />
    </Layout>
  );
};
