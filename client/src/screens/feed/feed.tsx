import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Linking } from 'react-native';

import { useLocationName } from '@/api/posts/use-location-name';
import { setPostsQueryKey } from '@/core/posts';
import type { RootNavigatorProp } from '@/navigation';
import { FeedList } from '@/screens/feed/feed-list';
import {
  FontAwesome,
  Image,
  LoadingComponent,
  Text,
  TouchableOpacity,
  View,
} from '@/ui';
import { Layout } from '@/ui/core/layout';
import { retrieveCurrentPosition } from '@/utils/geolocation-utils';

export const Feed = () => {
  const [longitude, setLongitude] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [distance, setDistance] = useState(200);
  const [isLoading, setLoading] = useState(true);

  const { navigate } = useNavigation<RootNavigatorProp>();

  const { data: locationName } = useLocationName({
    variables: {
      latitude,
      longitude,
    },
    enabled: latitude !== null && longitude !== null,
  });

  useEffect(() => {
    if (longitude !== null && latitude !== null) {
      setPostsQueryKey({
        longitude,
        latitude,
        distance,
      });
    }
  }, [longitude, latitude, distance]);

  const updateLocation = async (): Promise<void> => {
    await retrieveCurrentPosition()
      .catch((error) => {
        setLoading(false);
        return Promise.reject(error);
      })
      .then((location) => {
        setLoading(false);
        if (location !== null) {
          setLatitude(location.latitude);
          setLongitude(location.longitude);
        }
      });
  };

  useEffect(() => {
    updateLocation();
  }, []);

  const openAppSettings = () => {
    Linking.openSettings();
  };

  if (isLoading) {
    return <LoadingComponent />;
  }

  // TODO: To check if the changes in device settings trigger an update of the update location fn
  if (longitude === null || latitude === null) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <Image
          source={require('assets/images/location-permission.png')}
          className="h-72 w-72"
          placeholder={null}
          priority="high"
        />
        <Text className="text-center">
          Location permission is required. Please grant the location permission
          in your device settings to proceed.
        </Text>
        <Text className="pt-2 text-primary-400" onPress={openAppSettings}>
          Enable your location in Settings
        </Text>
      </View>
    );
  }

  return (
    <Layout className="flex-1" hasHorizontalPadding={false}>
      <TouchableOpacity
        onPress={() => navigate('AddFeed')}
        className="absolute bottom-3 right-3 z-10 items-center justify-center rounded-full bg-primary-400 p-[14px]"
      >
        <FontAwesome name="pencil" size={24} color="white" />
      </TouchableOpacity>

      <FeedList
        latitude={latitude}
        longitude={longitude}
        distance={distance}
        refreshCallback={async () => await updateLocation()}
        location={locationName}
        setDistanceCallback={(dist) => setDistance(dist)}
      />
    </Layout>
  );
};
