import { useActionSheet } from '@expo/react-native-action-sheet';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';

import type { GeolocationName, Post } from '@/api';
import { usePosts } from '@/api';
import type { FeedNavigatorProp } from '@/navigation/feed-navigator';
import { colors, EmptyList, Text, TouchableOpacity, View } from '@/ui';

import { Card } from './card';

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
  const { colorScheme } = useColorScheme();

  const iconColor =
    colorScheme === 'dark' ? colors.neutral[400] : colors.neutral[500];

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
        options,
        cancelButtonIndex,
        title: 'Select Distance Range',
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
    <TouchableOpacity
      className="m-2 block flex-row items-center rounded-md border-[1px] border-neutral-400 p-4 shadow-xl dark:border-charcoal-700 dark:bg-charcoal-800"
      onPress={() => setShowFullName((prev) => !prev)}
    >
      <Icon name="location-arrow" color={iconColor} size={24} />
      <Text
        className="mx-4 flex-1 text-neutral-600 dark:text-white"
        variant="sm"
      >
        {`Displaying feeds within ${formatDistanceName(
          distance
        )} from ${locationName}`}
      </Text>
      <TouchableOpacity onPress={onPressActionSheet}>
        <Ionicons name="ios-filter" color={iconColor} size={24} />
      </TouchableOpacity>
    </TouchableOpacity>
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

  const { navigate } = useNavigation<FeedNavigatorProp>();

  const handleRefresh = async () => {
    await refreshCallback();
    refetch();

    setRefreshing(false);
  };

  const renderItem = React.useCallback(
    ({ item }: { item: Post }) => (
      <Card {...item} onPress={() => navigate('Post', { post: item })} />
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
    return <View className="py-6" />;
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
    <View className="flex-1">
      <FlashList
        ListHeaderComponent={header}
        data={allPosts}
        renderItem={renderItem}
        keyExtractor={(_, index) => `item-${index}`}
        estimatedItemSize={200}
        ListEmptyComponent={<EmptyList isLoading={isLoading} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
        ListFooterComponent={footer}
      />
    </View>
  );
};
