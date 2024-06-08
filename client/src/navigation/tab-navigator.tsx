import NetInfo from '@react-native-community/netinfo';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ComponentType } from 'react';
import * as React from 'react';
import { hideMessage } from 'react-native-flash-message';
import type { SvgProps } from 'react-native-svg';

import { useTheme } from '@/core';
import { ProfileNavigator } from '@/navigation/profile-navigator';
import {
  colors,
  Feed as FeedIcon,
  Ionicons,
  showNoConnectionMessage,
} from '@/ui';

import { FeedNavigator } from './feed-navigator';

type TabParamList = {
  FeedNavigator: undefined;
  ProfileNavigator: undefined;
};

type TabType = {
  name: keyof TabParamList;
  component: ComponentType<any>;
  label: string;
};

type TabIconsType = {
  [key in keyof TabParamList]: (props: SvgProps) => JSX.Element;
};

const Tab = createBottomTabNavigator<TabParamList>();

const tabsIcons: TabIconsType = {
  FeedNavigator: (props: SvgProps) => <FeedIcon {...props} />,
  ProfileNavigator: ({ color }: SvgProps) => (
    <Ionicons name="person-circle-outline" size={24} color={color} />
  ),
};

export type TabList<T extends keyof TabParamList> = {
  navigation: NativeStackNavigationProp<TabParamList, T>;
  route: RouteProp<TabParamList, T>;
};

const tabs: TabType[] = [
  {
    name: 'FeedNavigator',
    component: FeedNavigator,
    label: 'Feed',
  },
  {
    name: 'ProfileNavigator',
    component: ProfileNavigator,
    label: 'Profile',
  },
];

type BarIconType = {
  name: keyof TabParamList;
  color: string;
};

const BarIcon = ({ color, name, ...reset }: BarIconType) => {
  const Icon = tabsIcons[name];

  return <Icon color={color} {...reset} />;
};

export const TabNavigator = () => {
  const isDark = useTheme.use.colorScheme() === 'dark';

  const [isConnected, setIsConnected] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((currentState) => {
      if (currentState.isConnected !== null) {
        setIsConnected(currentState.isConnected);
        console.log('The network is connected: ' + currentState.isConnected);
      }
    });

    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!isConnected) {
      showNoConnectionMessage();
    } else {
      hideMessage();
    }
  }, [isConnected]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarInactiveTintColor: isDark
          ? colors.charcoal[400]
          : colors.neutral[400],
        // eslint-disable-next-line react/no-unstable-nested-components
        tabBarIcon: ({ color }) => <BarIcon name={route.name} color={color} />,
      })}
      initialRouteName="FeedNavigator"
    >
      <Tab.Group
        screenOptions={{
          headerShown: false,
        }}
      >
        {tabs.map(({ name, component, label }) => {
          return (
            <Tab.Screen
              key={name}
              name={name}
              component={component}
              options={{
                title: label,
              }}
            />
          );
        })}
      </Tab.Group>
    </Tab.Navigator>
  );
};
