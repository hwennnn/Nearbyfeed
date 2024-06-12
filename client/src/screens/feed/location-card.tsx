import React from 'react';
import { Marker } from 'react-native-maps';
import openMap from 'react-native-open-maps';

import type { PostLocation } from '@/api';
import { SMapView, Text, TouchableOpacity, View } from '@/ui';
import { Ionicons } from '@/ui/icons/vector-icons';

type Props = {
  location: PostLocation;
};

export const LocationCard = ({ location }: Props) => {
  const { latitude, longitude, name, formattedAddress } = location;

  const openLocationInMap = () => {
    openMap({
      latitude: 1.44191,
      longitude: 103.77436,
      query: formattedAddress,
    });
  };

  return (
    <View className="mt-4 flex-1 space-y-2">
      <View className="h-[270px] flex-1 space-y-2">
        <SMapView
          className="h-full w-full flex-1"
          region={{
            latitude,
            longitude,
            latitudeDelta: 0.00177,
            longitudeDelta: 0.00177,
          }}
          showsMyLocationButton={false}
          showsUserLocation={false}
          pitchEnabled={false}
          rotateEnabled={false}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <Marker
            key={0}
            coordinate={{
              latitude,
              longitude,
            }}
            title={name}
          />
        </SMapView>
      </View>

      <TouchableOpacity
        className="flex-1 flex-row items-center space-x-2 rounded-lg border-[0.5px] border-neutral-300 bg-neutral-100 p-2 dark:border-charcoal-850 dark:bg-charcoal-850"
        onPress={openLocationInMap}
      >
        <Ionicons
          name="location-sharp"
          size={28}
          className="text-neutral-500 dark:text-neutral-400"
        />

        <View className="flex-col">
          <Text
            className="font-medium text-gray-600 dark:text-gray-300"
            variant="sm"
          >
            {name}
          </Text>

          <Text className="text-gray-600 dark:text-gray-300" variant="sm">
            {formattedAddress}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};
