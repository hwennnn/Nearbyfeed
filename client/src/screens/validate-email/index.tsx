/* eslint-disable react-native/no-inline-styles */
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import OtpTextInput from 'react-native-text-input-otp';

import { useResendVerifyEmail, useVerifyEmail } from '@/api';
import { signIn, useIsFirstTime } from '@/core';
import { setUser } from '@/core/user';
import type { AuthStackParamList } from '@/navigation/auth-navigator';
import {
  Button,
  Header,
  showSuccessMessage,
  Text,
  TouchableOpacity,
  View,
} from '@/ui';
import { Layout } from '@/ui/core/layout';
import colors from '@/ui/theme/colors';
import { timeUtils } from '@/utils/time-utils';

type Props = RouteProp<AuthStackParamList, 'ValidateEmail'>;

export const ValidateEmailScreen = () => {
  const [_, setIsFirstTime] = useIsFirstTime();

  const { params } = useRoute<Props>();
  let { pendingUserId, email, sessionId: sessionIdFromProps } = params;

  const [sessionId, setSessionId] = useState(sessionIdFromProps);
  const [otpCode, setOtpCode] = useState('');

  const [countdown, setCountdown] = useState(10 * 60); // 10 minutes in seconds
  const [resetCountdown, setResetCountdown] = useState(0);

  const [disabledResend, setDisabledResend] = useState(false);

  console.log(pendingUserId, email, sessionId);

  const {
    isLoading,
    error,
    mutateAsync: mutateVerifyEmail,
  } = useVerifyEmail({
    onSuccess: (result) => {
      showSuccessMessage('Your email has been verified.');
      const tokens = result.tokens;

      signIn(tokens);
      setUser(result.user);
      setIsFirstTime(false);
    },
  });

  const { mutateAsync: mutateResendVerifyEmail } = useResendVerifyEmail({
    onSuccess: (data) => {
      setCountdown(10 * 60); // Reset timer to 10 minutes

      setSessionId(data.sessionId);
    },
  });

  const verifyEmail = async (): Promise<void> => {
    mutateVerifyEmail({
      pendingUserId,
      sessionId,
      otpCode,
    });
  };

  const resendEmailVerification = async (): Promise<void> => {
    setDisabledResend(true);
    setResetCountdown(2 * 60);
    await mutateResendVerifyEmail({
      pendingUserId,
    });
  };

  React.useEffect(() => {
    if (countdown > 0) {
      const timerId = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [countdown]);

  React.useEffect(() => {
    if (resetCountdown > 0) {
      const timerId = setTimeout(() => setCountdown(resetCountdown - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      setDisabledResend(false);
    }
  }, [resetCountdown]);

  return (
    <Layout className="flex-1" verticalPadding={80}>
      <Header isDisabledBack={isLoading} headerTitle="Verify email address" />

      <View className="mt-8 space-y-4 p-4">
        {typeof error === 'string' && (
          <Text className="pb-4 text-center text-red-600">{error}</Text>
        )}

        <Text variant="md" className="pb-2 text-center">
          We have sent a OTP code to your email
          <Text className="text-primary-400">{` ${email} `}</Text>
        </Text>

        <Text variant="md" className="text-center text-primary-600">
          {timeUtils.formatCountdownTime(countdown)}
        </Text>

        <View className="pt-4">
          <OtpTextInput
            otp={otpCode}
            setOtp={setOtpCode}
            digits={6}
            style={{
              borderRadius: 0,
              borderTopWidth: 0,
              borderRightWidth: 0,
              borderLeftWidth: 0,
              height: 45,
            }}
            fontStyle={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}
            focusedStyle={{
              borderColor: colors.primary['400'],
              borderBottomWidth: 2,
            }}
          />
        </View>

        <View className="pt-2">
          <Button
            loading={isLoading}
            disabled={isLoading || otpCode.length !== 6}
            label="Submit"
            onPress={verifyEmail}
            variant="secondary"
          />
        </View>

        <View className="flex-row items-center justify-center space-x-2 pt-2">
          <Text variant="md" className="text-center">
            Didn't receive the OTP?
          </Text>
          <TouchableOpacity
            onPress={resendEmailVerification}
            className="items-center justify-center"
            disabled={disabledResend}
          >
            <Text
              className={`font-semibold ${
                disabledResend ? 'text-gray-500' : 'text-primary-400'
              }`}
            >
              Resend
            </Text>
          </TouchableOpacity>
        </View>

        {disabledResend && (
          <Text variant="md" className="text-center text-red-600">
            You can resend the OTP in{' '}
            {timeUtils.formatCountdownTime(resetCountdown)}
          </Text>
        )}
      </View>
    </Layout>
  );
};
