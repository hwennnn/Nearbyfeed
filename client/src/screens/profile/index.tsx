import { useNavigation } from '@react-navigation/native';
import * as React from 'react';
import { Alert } from 'react-native';

import { useSelf } from '@/api/users';
import { signOut, useAuth, useTheme } from '@/core';
import type { RootNavigatorProp } from '@/navigation';
import type { ProfileNavigatorProp } from '@/navigation/profile-navigator';
import {
  Image,
  LayoutWithoutKeyboard,
  LoadingComponent,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from '@/ui';
import { Ionicons, MaterialIcons } from '@/ui/icons/vector-icons';
import { getInitials } from '@/utils/get-initials';

import { BottomSheetItem } from '../../ui/core/bottom-sheet/bottom-sheet-item';
import { ItemsContainer } from './items-container';
import { ThemeItem } from './theme-item';

export const Profile = () => {
  const isLoggedIn = useAuth().status === 'signIn';

  const { isLoading, data: user } = useSelf({
    variables: {},
    enabled: isLoggedIn,
  });

  const { navigate: navigateRoot } = useNavigation<RootNavigatorProp>();

  const { navigate } = useNavigation<ProfileNavigatorProp>();

  const navToEditProfile = () => {
    if (user !== null && user !== undefined) {
      navigate('EditProfile');
    }
  };

  const navToMyPosts = () => {
    if (user !== null && user !== undefined) {
      navigateRoot('MyPosts');
    }
  };

  const navToMyComments = () => {
    if (user !== null && user !== undefined) {
      navigateRoot('MyComments');
    }
  };

  const navToBlockedAccounts = () => {
    if (user !== null && user !== undefined) {
      navigate('BlockedAccounts');
    }
  };

  const navToUpdatePassword = () => {
    if (user !== null && user !== undefined) {
      navigate('UpdatePassword');
    }
  };

  const navToAuth = () => {
    if (!isLoggedIn) {
      navigateRoot('Auth', {
        screen: 'AuthOnboarding',
        params: {
          isCloseButton: true,
        },
      });
    }
  };

  if (isLoggedIn && isLoading) {
    return <LoadingComponent />;
  }

  const signOutUser = (): void => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out? You will need to log in again to access your account.',
      [
        {
          text: 'Logout',
          onPress: () => {
            signOut();
          },
          style: 'destructive',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      {
        userInterfaceStyle: useTheme.getState().colorScheme,
      }
    );
  };

  const hasPassword = user !== null && user !== undefined && user.hasPassword;

  return (
    <LayoutWithoutKeyboard className="flex-1">
      <ScrollView className="flex-1 px-4 pt-2">
        <Pressable className="flex-1">
          {isLoggedIn && (
            <View className="flex-1 items-center justify-center space-y-1">
              <View className="h-[80px] w-[80px] items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600">
                {user?.image !== null && user?.image !== undefined ? (
                  <Image
                    source={{ uri: user?.image }}
                    className="h-[80px] w-[80px] rounded-full"
                  />
                ) : (
                  <Text
                    className="font-medium text-gray-600 dark:text-gray-300"
                    variant="h3"
                  >
                    {getInitials(user?.username ?? 'User')}
                  </Text>
                )}
              </View>

              <Text variant="lg" className="font-semibold">
                {user?.username ?? ''}
              </Text>

              <Text variant="sm" className="text-gray-600 dark:text-gray-300">
                {user?.email ?? ''}
              </Text>

              <View className="items-center justify-center pt-2">
                <TouchableOpacity
                  onPress={navToEditProfile}
                  className="flex-row items-center justify-center space-x-2 rounded-full bg-black px-4 py-2 dark:bg-primary-600"
                >
                  <Text className="text-white">Edit Profile</Text>
                  <Ionicons
                    name="chevron-forward"
                    className="text-white"
                    size={16}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!isLoggedIn && (
            <View className="items-center justify-center pt-2">
              <TouchableOpacity
                onPress={navToAuth}
                className="dark:bg- flex-row items-center justify-center space-x-2 rounded-full bg-black px-4 py-2 dark:bg-primary-600"
              >
                <Text className="text-white">Log In / Register</Text>
                <Ionicons
                  name="chevron-forward"
                  className="text-white"
                  size={16}
                />
              </TouchableOpacity>
            </View>
          )}

          {isLoggedIn && (
            <>
              <ItemsContainer title="My Activities">
                <BottomSheetItem text="My Posts" onPress={navToMyPosts} />
                <BottomSheetItem text="My Comments" onPress={navToMyComments} />
              </ItemsContainer>

              <ItemsContainer title="My Accounts">
                <BottomSheetItem text="Manage Account Linking" />
                <BottomSheetItem
                  text="Manage Blocked Accounts"
                  onPress={navToBlockedAccounts}
                />
                {hasPassword && (
                  <BottomSheetItem
                    text="Update Password"
                    onPress={navToUpdatePassword}
                  />
                )}
              </ItemsContainer>
            </>
          )}

          <ItemsContainer title="General">
            <ThemeItem />
            <BottomSheetItem text="Privacy Policy" onPress={() => {}} />
            <BottomSheetItem text="Terms of service" onPress={() => {}} />
          </ItemsContainer>

          {/* <ItemsContainer title="settings.support_us">
          <BottomSheetItem
            text="settings.share"
            icon={<Share color={iconColor} />}
            onPress={() => {}}
          />
          <BottomSheetItem
            text="settings.rate"
            icon={<Rate color={iconColor} />}
            onPress={() => {}}
          />
          <BottomSheetItem
            text="settings.support"
            icon={<Support color={iconColor} />}
            onPress={() => {}}
          />
        </ItemsContainer> */}

          {isLoggedIn && (
            <View className="my-8 flex-1">
              <ItemsContainer>
                <BottomSheetItem
                  text="Sign out"
                  onPress={signOutUser}
                  textProps="text-danger-500 font-semibold"
                  icon={
                    <MaterialIcons
                      name="logout"
                      size={20}
                      className="text-danger-500"
                    />
                  }
                />
              </ItemsContainer>
            </View>
          )}
        </Pressable>
      </ScrollView>
    </LayoutWithoutKeyboard>
  );
};
