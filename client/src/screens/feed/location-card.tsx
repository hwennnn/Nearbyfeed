import React from 'react';
import { Marker } from 'react-native-maps';

import type { PostLocation } from '@/api';
import { SMapView, Text, TouchableOpacity, View } from '@/ui';
import { Ionicons } from '@/ui/icons/vector-icons';

type Props = {
  location: PostLocation;
};

export const LocationCard = ({ location }: Props) => {
  const { latitude, longitude, name, formattedAddress } = location;

  const openLocationInMap = () => {};

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
          onRegionChange={(region) => {
            console.log(region);
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
            title={formattedAddress}
          />
        </SMapView>
      </View>

      <TouchableOpacity className="flex-1 flex-row items-center space-x-2 rounded-lg bg-charcoal-800 p-2">
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
