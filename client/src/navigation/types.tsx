import type { NavigatorScreenParams } from '@react-navigation/native';

import type { Post as PostEntitiy } from '@/api';

import type { AuthStackParamList } from './auth-navigator';
import type { FeedStackParamList } from './feed-navigator';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<FeedStackParamList>;
  Onboarding: undefined;
  AddFeed: undefined;
  FeedDetails: { post: PostEntitiy };
};

// very important to type check useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
