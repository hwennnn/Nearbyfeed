import { Env } from '@env';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import React from 'react';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

import { useTheme } from '@/core';
import { colors, Pressable, showErrorMessage, Text, View } from '@/ui';
import { renderBackdrop } from '@/ui/core/bottom-sheet';
import type { GooglePlaceLocation } from '@/utils/geolocation-utils';
import {
  calculateDistance,
  retrieveCurrentPosition,
} from '@/utils/geolocation-utils';

type Props = {
  onLocationSelect: (location: GooglePlaceLocation | null) => void;
};

export const SearchPlacesBottomSheet = React.forwardRef<
  BottomSheetModal,
  Props
>(({ onLocationSelect }, ref) => {
  const isDark = useTheme.use.colorScheme() === 'dark';
  const [selectedLocation, setSelectedLocation] =
    React.useState<GooglePlaceLocation | null>(null);

  const handleLocationSelect = async (location: GooglePlaceLocation) => {
    const currentLocation = await retrieveCurrentPosition();
    if (currentLocation === null) {
      showErrorMessage('Location must be enabled to create a post.');
      return;
    }

    const distance = calculateDistance(currentLocation, location);
    if (distance > 2) {
      showErrorMessage('Please select a location near you.');
      return;
    }

    setSelectedLocation(location);
    onLocationSelect(location);
  };

  const onClear = () => {
    setSelectedLocation(null);
    onLocationSelect(null);
  };

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={['75%']}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{
        backgroundColor: isDark ? colors.white : colors.charcoal[800],
      }}
      backgroundStyle={{
        backgroundColor: isDark ? colors.charcoal[950] : colors.white,
      }}
    >
      <View className="flex-1 space-y-4 px-4">
        <View className="mb-2 space-y-1">
          <Text variant="md">
            Current selected location:{' '}
            <Text className="font-medium">
              {selectedLocation !== null && selectedLocation.name}
            </Text>
          </Text>

          {selectedLocation !== null && (
            <Pressable onPress={onClear}>
              <Text variant="sm" className="text-primary-400">
                Clear selection
              </Text>
            </Pressable>
          )}
        </View>

        <LocationAutoComplete onLocationSelect={handleLocationSelect} />
      </View>
    </BottomSheetModal>
  );
});

type LocationAutoCompleteProps = {
  onLocationSelect: (location: GooglePlaceLocation) => void;
};

const LocationAutoComplete = ({
  onLocationSelect,
}: LocationAutoCompleteProps) => {
  const isDark = useTheme.use.colorScheme() === 'dark';

  const styles = {
    container: {
      flex: 1,
    },
    textInputContainer: {
      flexDirection: 'row',
    },
    textInput: {
      backgroundColor: isDark ? '#333333' : '#F2F2F2',
      color: isDark ? '#FFFFFF' : '#000000',
      height: 44,
      borderRadius: 5,
      paddingVertical: 5,
      paddingHorizontal: 10,
      fontSize: 15,
      flex: 1,
    },
    poweredContainer: {
      justifyContent: 'flex-end',
      alignItems: 'center',
      borderBottomRightRadius: 5,
      borderBottomLeftRadius: 5,
      borderColor: isDark ? '#555555' : '#c8c7cc',
      borderTopWidth: 0.5,
    },
    powered: {
      tintColor: isDark ? '#FFFFFF' : '#000000',
    },
    listView: {
      backgroundColor: isDark ? '#333333' : '#FFFFFF',
    },
    row: {
      backgroundColor: isDark ? '#333333' : '#FFFFFF',
      padding: 13,
      height: 44,
      flexDirection: 'row',
    },
    separator: {
      height: 0.5,
      backgroundColor: isDark ? '#555555' : '#c8c7cc',
    },
    description: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    loader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      height: 20,
    },
  };

  return (
    <GooglePlacesAutocomplete
      placeholder="Enter a location"
      minLength={4}
      fetchDetails={true}
      onPress={(_data, details = null) => {
        if (details) {
          const location: GooglePlaceLocation = {
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng,
            name: details.name,
            formattedAddress: details.formatted_address,
          };
          onLocationSelect(location);
        }
      }}
      enablePoweredByContainer={false}
      query={{
        key: Env.GOOGLE_PLACES_API_KEY,
        language: 'en',
      }}
      styles={styles}
    />
  );
};
