import { Env } from '@env';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';

import { useSelf } from '@/api/users';
import { signOut } from '@/core';
import { resetUser } from '@/core/user';
import type { ProfileNavigatorProp } from '@/navigation/profile-navigator';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from '@/ui';
import { Layout } from '@/ui/core/layout';
import { Github, Rate, Share, Support, Website } from '@/ui/icons';
import colors from '@/ui/theme/colors';
import { getInitials } from '@/utils/get-initials';

import { BottomSheetItem } from '../../ui/core/bottom-sheet/bottom-sheet-item';
import { ItemsContainer } from './items-container';
import { LanguageItem } from './language-item';
import { ThemeItem } from './theme-item';

export const Profile = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? colors.neutral[400] : colors.neutral[500];

  const { isLoading, data: user } = useSelf({
    variables: {},
  });

  const { navigate } = useNavigation<ProfileNavigatorProp>();

  const navToEditProfile = () => {
    if (user !== null && user !== undefined) {
      navigate('EditProfile');
    }
  };

  if (isLoading) {
    return (
      <Layout className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </Layout>
    );
  }

  const signOutUser = (): void => {
    signOut();
    resetUser();
  };

  return (
    <SafeAreaView className="flex-1 ">
      <ScrollView className="flex-1 px-4 pt-2">
        <View className="flex-1 items-center justify-center space-y-1">
          <View className="h-[80px] w-[80px] items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600">
            {user?.image === null && (
              <Text
                className="font-medium text-gray-600 dark:text-gray-300"
                variant="h3"
              >
                {getInitials(user.username)}
              </Text>
            )}
            {user?.image !== null && (
              <Image
                source={{ uri: user?.image }}
                className="h-[80px] w-[80px] rounded-full"
              />
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
              className="dark:bg- flex-row items-center justify-center space-x-2 rounded-full bg-black py-2 px-4 dark:bg-primary-600"
            >
              <Text className="text-white">Edit Profile</Text>
              <Icon name="chevron-forward" color={'white'} size={16} />
            </TouchableOpacity>
          </View>
        </View>

        <ItemsContainer title="settings.generale">
          <LanguageItem />
          <ThemeItem />
        </ItemsContainer>

        <ItemsContainer title="settings.about">
          <BottomSheetItem text="settings.app_name" value={Env.NAME} />
          <BottomSheetItem text="settings.version" value={Env.VERSION} />
        </ItemsContainer>

        <ItemsContainer title="settings.support_us">
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
        </ItemsContainer>

        <ItemsContainer title="settings.links">
          <BottomSheetItem text="settings.privacy" onPress={() => {}} />
          <BottomSheetItem text="settings.terms" onPress={() => {}} />
          <BottomSheetItem
            text="settings.github"
            icon={<Github color={iconColor} />}
            onPress={() => {}}
          />
          <BottomSheetItem
            text="settings.website"
            icon={<Website color={iconColor} />}
            onPress={() => {}}
          />
        </ItemsContainer>

        <View className="my-8">
          <ItemsContainer>
            <BottomSheetItem text="settings.logout" onPress={signOutUser} />
          </ItemsContainer>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
