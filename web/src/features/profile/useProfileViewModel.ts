import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  fetchMyComments,
  fetchMyPosts,
  fetchSelf,
  login,
  register,
  resendVerifyEmail,
  unblockUser,
  verifyEmail,
  type PendingRegistration,
} from '../../lib/api';
import {
  type CommentWithPost,
  type Post,
  type Session,
  type User,
} from '../../types';
import { getUnblockSuccessMessage } from '../moderation/block-presentation';
import { type ProfileTab } from './profile-types';

type AuthMode = 'login' | 'register';

export type ProfileViewModel = {
  auth: {
    email: string;
    isError: boolean;
    isPending: boolean;
    mode: AuthMode;
    notice: string | null;
    onEmailChange: (value: string) => void;
    onModeChange: (mode: AuthMode) => void;
    onPasswordChange: (value: string) => void;
    onSubmit: () => void;
    onUsernameChange: (value: string) => void;
    password: string;
    username: string;
  };
  signedIn: {
    activeProvidersCount: number;
    myComments: CommentWithPost[];
    myPosts: Post[];
    mutedNotice: string | null;
    onUnblockUser: (blockedId: number, username: string) => void;
    profile: User;
    profileTab: ProfileTab;
    setProfileTab: (tab: ProfileTab) => void;
    unblockingUserId: number | null;
  } | null;
  state: 'auth' | 'signed-in' | 'verify';
  verify: {
    isError: boolean;
    isResending: boolean;
    isVerifying: boolean;
    notice: string | null;
    onBack: () => void;
    onOtpChange: (value: string) => void;
    onResend: () => void;
    onSubmit: () => void;
    otpCode: string;
    pendingRegistration: PendingRegistration;
  } | null;
};

export const useProfileViewModel = ({
  onSession,
  session,
}: {
  onSession: (session: Session) => void;
  session: Session | null;
}): ProfileViewModel => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<AuthMode>('login');
  const [profileTab, setProfileTab] = useState<ProfileTab>('posts');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [mutedNotice, setMutedNotice] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [pendingRegistration, setPendingRegistration] =
    useState<PendingRegistration | null>(null);
  const userId = session?.user.id;
  const selfQuery = useQuery({
    queryKey: ['self', userId],
    queryFn: fetchSelf,
    enabled: session !== null,
  });
  const myPostsQuery = useQuery({
    queryKey: ['my-posts', userId],
    queryFn: async () => await fetchMyPosts(userId as number),
    enabled: userId !== undefined,
  });
  const myCommentsQuery = useQuery({
    queryKey: ['my-comments', userId],
    queryFn: async () => await fetchMyComments(userId as number),
    enabled: userId !== undefined,
  });
  const loginMutation = useMutation({
    mutationFn: async () => await login(email, password),
    onSuccess: onSession,
  });
  const registerMutation = useMutation({
    mutationFn: async () => await register(username, email, password),
    onSuccess: (result) => {
      setPendingRegistration(result);
      setOtpCode('');
      setNotice(`Fresh code sent to ${result.pendingUser.email}`);
    },
  });
  const verifyEmailMutation = useMutation({
    mutationFn: async () => {
      if (pendingRegistration === null) {
        throw new Error('Missing pending registration');
      }

      return await verifyEmail({
        otpCode,
        pendingUserId: pendingRegistration.pendingUser.id,
        sessionId: pendingRegistration.sessionId,
      });
    },
    onSuccess: (result) => {
      setPendingRegistration(null);
      setOtpCode('');
      setNotice(null);
      onSession(result);
    },
  });
  const resendVerifyEmailMutation = useMutation({
    mutationFn: async () => {
      if (pendingRegistration === null) {
        throw new Error('Missing pending registration');
      }

      return await resendVerifyEmail(pendingRegistration.pendingUser.id);
    },
    onSuccess: (result) => {
      setPendingRegistration((current) =>
        current === null ? current : { ...current, sessionId: result.sessionId },
      );
      setOtpCode('');
      setNotice('New code sent. The old one is retired.');
    },
  });
  const unblockUserMutation = useMutation<
    void,
    Error,
    { blockedId: number; username: string }
  >({
    mutationFn: async ({ blockedId }) => {
      if (userId === undefined) {
        throw new Error('Missing current user');
      }

      await unblockUser({ blockedId, userId });
    },
    onSuccess: async (_data, variables) => {
      setMutedNotice(getUnblockSuccessMessage(variables.username));
      await queryClient.invalidateQueries({ queryKey: ['self'] });
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const auth = {
    email,
    isError: loginMutation.isError || registerMutation.isError,
    isPending: loginMutation.isPending || registerMutation.isPending,
    mode,
    notice,
    onEmailChange: setEmail,
    onModeChange: setMode,
    onPasswordChange: setPassword,
    onSubmit: () =>
      mode === 'login' ? loginMutation.mutate() : registerMutation.mutate(),
    onUsernameChange: setUsername,
    password,
    username,
  };

  if (session !== null) {
    const profile = selfQuery.data ?? session.user;
    const myPosts = myPostsQuery.data?.posts ?? [];
    const myComments = myCommentsQuery.data?.comments ?? [];
    const activeProviders =
      profile.providers?.filter((provider) => provider.isActive) ?? [];

    return {
      auth,
      signedIn: {
        activeProvidersCount: activeProviders.length,
        myComments,
        myPosts,
        mutedNotice,
        onUnblockUser: (blockedId, username) =>
          unblockUserMutation.mutate({ blockedId, username }),
        profile,
        profileTab,
        setProfileTab,
        unblockingUserId:
          unblockUserMutation.isPending
            ? unblockUserMutation.variables?.blockedId ?? null
            : null,
      },
      state: 'signed-in',
      verify: null,
    };
  }

  if (pendingRegistration !== null) {
    return {
      auth,
      signedIn: null,
      state: 'verify',
      verify: {
        isError: verifyEmailMutation.isError || resendVerifyEmailMutation.isError,
        isResending: resendVerifyEmailMutation.isPending,
        isVerifying: verifyEmailMutation.isPending,
        notice,
        onBack: () => {
          setPendingRegistration(null);
          setOtpCode('');
          setMode('register');
        },
        onOtpChange: setOtpCode,
        onResend: () => resendVerifyEmailMutation.mutate(),
        onSubmit: () => verifyEmailMutation.mutate(),
        otpCode,
        pendingRegistration,
      },
    };
  }

  return {
    auth,
    signedIn: null,
    state: 'auth',
    verify: null,
  };
};
