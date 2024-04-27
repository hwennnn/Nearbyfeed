import { useNavigation } from '@react-navigation/native';
import { styled } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import MapView from 'react-native-maps';

import { useLocationName } from '@/api/posts/use-location-name';
import { setPostsQueryKey } from '@/core/posts';
import type { FeedNavigatorProp } from '@/navigation/feed-navigator';
import { ActivityIndicator, Image, Text } from '@/ui';
import { Layout } from '@/ui/core/layout';
import { retrieveCurrentPosition } from '@/utils/geolocation-utils';

const SMapView = styled(MapView);

export const MapScreen = () => {
  const [longitude, setLongitude] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [distance, setDistance] = useState(200);
  const [isLoading, setLoading] = useState(true);

  const { navigate } = useNavigation<FeedNavigatorProp>();

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
      <Layout className="flex-1 items-center justify-center">
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
          Location permission is required for the MapView. Please grant the
          location permission in your device settings to proceed.
        </Text>
        <Text className="pt-2 text-primary-400" onPress={openAppSettings}>
          Enable your location in Settings
        </Text>
      </Layout>
    );
  }

  return (
    <Layout className="flex-1" hasHorizontalPadding={false}>
      <SMapView
        className="h-full w-full flex-1"
        region={{
          latitude,
          longitude,
          latitudeDelta: 0.00177,
          longitudeDelta: 0.00177,
        }}
        onRegionChange={(region) => {
          console.log(region);
        }}
        showsMyLocationButton={true}
        showsUserLocation={true}
      />
    </Layout>
  );
};
