import { useActionSheet } from '@expo/react-native-action-sheet';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { useState } from 'react';
import { RefreshControl } from 'react-native';

import type { GeolocationName, Post } from '@/api';
import { usePosts } from '@/api';
import { useTheme } from '@/core';
import type { RootNavigatorProp } from '@/navigation/root-navigator';
import {
  colors,
  EmptyList,
  FontAwesome,
  Ionicons,
  Text,
  TouchableOpacity,
  View,
} from '@/ui';
import Divider from '@/ui/core/divider';

import { FeedCard } from './feed-card';

type Props = {
  longitude: number;
  latitude: number;
  distance: number;
  refreshCallback: () => Promise<void>;
  location: GeolocationName | null | undefined;
  setDistanceCallback: (distance: number) => void;
};

type LocationHeaderProps = {
  location: GeolocationName | null | undefined;
  distance: number;
  setDistanceCallback: (distance: number) => void;
};

const LocationHeader = ({
  distance,
  location,
  setDistanceCallback,
}: LocationHeaderProps) => {
  const [showFullName, setShowFullName] = useState(false);

  const { showActionSheetWithOptions } = useActionSheet();

  const onPressActionSheet = () => {
    const options = [
      'Within 200 meters',
      'Within 500 meters',
      'Within 1 kilometer',
      'Cancel',
    ];
    const values = [200, 500, 1000];

    const cancelButtonIndex = 3;

    showActionSheetWithOptions(
      {
        userInterfaceStyle: useTheme.getState().colorScheme,
        options,
        cancelButtonIndex,
        title: 'Select Distance Range',
        destructiveButtonIndex: values.findIndex((value) => value === distance),
      },
      (selectedIndex: number | undefined) => {
        switch (selectedIndex) {
          case undefined:
          case cancelButtonIndex:
            break;

          default:
            setDistanceCallback(values[selectedIndex]);
            break;
        }
      }
    );
  };

  const formatDistanceName = (dist: number): string => {
    switch (dist) {
      case 200:
        return '200m';

      case 500:
        return '500m';

      case 1000:
        return '1km';

      default:
        return '200m';
    }
  };

  const locationName =
    location === null || location === undefined
      ? '...'
      : showFullName
      ? location.displayName
      : location.locationName;

  return (
    <>
      <TouchableOpacity
        className="mx-4 mb-4 block flex-row items-center rounded-lg border border-neutral-400 bg-white p-4 dark:border-charcoal-700 dark:bg-charcoal-800"
        onPress={() => setShowFullName((prev) => !prev)}
      >
        <FontAwesome
          name="location-arrow"
          className="text-neutral-500 dark:text-neutral-400"
          size={24}
        />
        <Text
          className="mx-4 flex-1 text-neutral-600 dark:text-white"
          variant="sm"
        >
          {`Displaying feeds within ${formatDistanceName(
            distance
          )} from ${locationName}`}
        </Text>
        <TouchableOpacity onPress={onPressActionSheet}>
          <Ionicons
            name="ios-filter"
            className="text-neutral-500 dark:text-neutral-400"
            size={24}
          />
        </TouchableOpacity>
      </TouchableOpacity>
      <Divider />
    </>
  );
};

export const FeedList = ({
  longitude,
  latitude,
  distance,
  refreshCallback,
  location,
  setDistanceCallback,
}: Props) => {
  const [refreshing, setRefreshing] = useState(false);
  const isDark = useTheme.use.colorScheme() === 'dark';
  const refreshColor = isDark ? colors.neutral[400] : colors.neutral[500];

  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = usePosts({
    variables: {
      distance,
      latitude,
      longitude,
    },
  });

  const { navigate } = useNavigation<RootNavigatorProp>();

  const handleRefresh = async () => {
    await refreshCallback();
    refetch();

    setRefreshing(false);
  };

  const renderItem = React.useCallback(
    ({ item }: { item: Post }) => (
      <FeedCard
        {...item}
        onPress={() => {
          if (item.isOptimistic === true) return;
          navigate('FeedDetails', { postId: item.id });
        }}
      />
    ),
    [navigate]
  );

  const header = React.useCallback(() => {
    return (
      <LocationHeader
        distance={distance}
        location={location}
        setDistanceCallback={setDistanceCallback}
      />
    );
  }, [distance, location, setDistanceCallback]);

  const footer = React.useCallback(() => {
    return (
      <>
        <Divider />
        <View className="bg-white py-6 dark:bg-charcoal-900" />
      </>
    );
  }, []);

  if (isError) {
    return (
      <View>
        <Text> Error Loading data </Text>
      </View>
    );
  }

  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  const handleEndReached = () => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  };

  return (
    <View className="min-h-[2px] flex-1">
      <FlashList
        ItemSeparatorComponent={Divider}
        ListHeaderComponent={header}
        data={allPosts}
        renderItem={renderItem}
        keyExtractor={(_, index) => `item-${index}`}
        estimatedItemSize={200}
        ListEmptyComponent={<EmptyList isLoading={isLoading} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            title="Pull down to refresh"
            tintColor={refreshColor}
            titleColor={refreshColor}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
        ListFooterComponent={footer}
      />
    </View>
  );
};
