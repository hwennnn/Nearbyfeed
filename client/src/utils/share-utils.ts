import { Share } from 'react-native';

export const POST_SHARE_MESSAGE: string = `Discover amazing places and events around you with NearbyFeed! 🗺️

I've just found this fantastic spot/event on NearbyFeed. Check it out and see what's happening in our neighborhood! 🌟

[Link to the post]

Join me on NearbyFeed to explore more hidden gems and local happenings. Download the app now! 📲

#NearbyFeed #ExploreLocal #HiddenGems #CommunityEvents\
`;

export const onShare = async (message: string): Promise<void> => {
  const result = await Share.share({
    message,
  });

  if (result.action === Share.sharedAction) {
    if (result.activityType) {
      // shared with activity type of result.activityType
    } else {
      // shared
    }
  }
};
