import React, { useEffect, useState } from 'react';
import { Linking } from 'react-native';

import { useLocationName } from '@/api/posts/use-location-name';
import { setPostsQueryKey } from '@/core/posts';
import { FeedList } from '@/screens/feed/feed-list';
import { ActivityIndicator, Image, Text, View } from '@/ui';
import { Layout } from '@/ui/core/layout';
import { retrieveCurrentPosition } from '@/utils/geolocation-utils';

export const Feed = () => {
  const [longitude, setLongitude] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [distance, setDistance] = useState(200);
  const [isLoading, setLoading] = useState(true);

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
    return (
      <Layout className="items-center justify-center">
        <ActivityIndicator />
      </Layout>
    );
  }

  if (longitude === null || latitude === null) {
    return (
      <Layout className="items-center justify-center">
        <Image
          source={require('assets/location-permission.png')}
          className="h-72 w-72"
        />
        <Text className="text-center">
          Location permission is required to access nearby feeds and create a
          post. Please grant the location permission in your device settings to
          proceed.
        </Text>
        <Text className="pt-2 text-primary-400" onPress={openAppSettings}>
          Enable your location in Settings
        </Text>
      </Layout>
    );
  }

  return (
    <View className="flex-1">
      <FeedList
        latitude={latitude}
        longitude={longitude}
        distance={distance}
        refreshCallback={async () => await updateLocation()}
        location={locationName}
        setDistanceCallback={(dist) => setDistance(dist)}
      />
    </View>
  );
};
