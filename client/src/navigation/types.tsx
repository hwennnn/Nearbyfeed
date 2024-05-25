import type { NavigatorScreenParams } from '@react-navigation/native';

import type { AuthStackParamList } from './auth-navigator';
import type { FeedStackParamList } from './feed-navigator';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<FeedStackParamList>;
  Onboarding: undefined;
  AddFeed: undefined;
  FeedDetails: { postId: number };
  CommentDetails: { commentId: number; postId: number; repliesCount: number };
  MyPosts: undefined;
};

// very important to type check useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
