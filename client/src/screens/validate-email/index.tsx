import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { openInbox } from 'react-native-email-link';

import type { AuthStackParamList } from '@/navigation/auth-navigator';
import { Button, Text, View } from '@/ui';

type Props = RouteProp<AuthStackParamList, 'ValidateEmail'>;

const ValidateEmailScreen = () => {
  const { params } = useRoute<Props>();
  let { email } = params;

  const { navigate } = useNavigation();
  // const emailAddress = route.params?.emailAddress ?? user?.email;
  const [disabledResend, setDisabledResend] = useState(false);

  const launchEmailApp = async (): Promise<void> => {
    await openInbox();
  };

  const resendEmailVerification = async (): Promise<void> => {
    // setDisabledResend(true);
    // await sendVerificationEmail({
    //   email: emailAddress,
    // });
  };

  const navToLoginPage = async (): Promise<void> => {
    navigate('Auth', {
      screen: 'Login',
    });
  };

  return (
    <View className="flex-1 justify-center space-y-4 p-4">
      <Text variant="h1" className="pb-2 text-center">
        Verify email address
      </Text>

      <Text variant="md" className="pb-2 text-center">
        We have sent a verification email to your email
        <Text className="text-primary-400">{` ${email} `}</Text>. Please click
        on the highlighted link in the email to verify your email address.
      </Text>

      <Button
        label="Launch Email App"
        onPress={launchEmailApp}
        variant="primary"
      />

      <Button
        label="Back to Login Page"
        onPress={navToLoginPage}
        variant="secondary"
      />
    </View>
  );
};

export default ValidateEmailScreen;
