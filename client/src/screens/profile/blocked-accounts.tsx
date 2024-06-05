import { FlashList } from '@shopify/flash-list';
import React from 'react';
import { Alert, RefreshControl } from 'react-native';

import { type BlockedUser, queryClient } from '@/api';
import { useSelf, useUnblockUser } from '@/api/users';
import { useTheme } from '@/core';
import { setAppLoading } from '@/core/loading';
import {
  colors,
  Header,
  Image,
  LayoutWithoutKeyboard,
  LoadingButton,
  LoadingComponent,
  showErrorMessage,
  showSuccessMessage,
  Text,
  View,
} from '@/ui';
import Divider from '@/ui/core/divider';
import { getInitials } from '@/utils/get-initials';

export const BlockedAccountScreen = () => {
  const [refreshing, setRefreshing] = React.useState(false);
  const scheme = useTheme.use.colorScheme();
  const isDark = scheme === 'dark';
  const refreshColor = isDark ? colors.neutral[400] : colors.neutral[500];

  const {
    isLoading,
    data: user,
    refetch,
  } = useSelf({
    variables: {},
  });

  const handleRefresh = async () => {
    refetch().then(() => {
      setRefreshing(false);
    });
  };

  const { mutate: unblockUser } = useUnblockUser();

  const handleUnblock = async (blockedId: number) => {
    setAppLoading(true);
    const currentUserId = user!.id;

    unblockUser(
      {
        userId: currentUserId,
        blockedId,
      },
      {
        onSuccess: () => {
          showSuccessMessage('You have successfully unblocked the user');
        },
        onError: () => {
          showErrorMessage('Something went wrong, please try again later');
        },
        onSettled: () => {
          setAppLoading(false);
          refetch();
          queryClient.invalidateQueries(['self']);
        },
      }
    );
  };

  const showAlertPopup = async (blockedId: number) => {
    Alert.alert(
      'Are you sure you want to unblock the user?',
      'You will be able to see the feeds and comments from that user again.',
      [
        {
          text: 'Unblock',
          onPress: () => {
            handleUnblock(blockedId);
          },
          style: 'destructive',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      {
        userInterfaceStyle: scheme,
      }
    );
  };

  const renderItem = ({ item }: { item: BlockedUser }) => (
    <View className="flex-1 flex-row justify-between py-4">
      <View className="flex-1 flex-row items-center space-x-2">
        <View className="h-[40px] w-[40px] items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600">
          {item?.image === null ? (
            <Text
              className="font-medium text-gray-600 dark:text-gray-300"
              variant="xs"
            >
              {getInitials(item.username)}
            </Text>
          ) : (
            <Image
              source={{ uri: item?.image }}
              className="border-1 h-[40px] w-[40px] rounded-full border-solid border-neutral-800"
            />
          )}
        </View>

        <Text className="font-semibold" variant="sm" numberOfLines={3}>
          {item.username}
        </Text>
      </View>

      <LoadingButton label="Unblock" onPress={() => showAlertPopup(item.id)} />
    </View>
  );

  if (isLoading) {
    return <LoadingComponent />;
  }

  const blockedUsers = user?.blockedUsers ?? [];

  return (
    <LayoutWithoutKeyboard className="flex-1">
      <Header headerTitle="Blocked accounts" isDisabledBack={isLoading} />

      <View className="min-h-[2px] flex-1 px-4">
        <FlashList
          ItemSeparatorComponent={Divider}
          data={blockedUsers}
          renderItem={renderItem}
          keyExtractor={(_, index) => `item-${index}`}
          estimatedItemSize={50}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              title="Pull down to refresh"
              tintColor={refreshColor}
              titleColor={refreshColor}
            />
          }
        />
      </View>
    </LayoutWithoutKeyboard>
  );
};
