import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { RefreshControl } from 'react-native';

import type { RootStackParamList } from '@/navigation';
import { CommentComposer } from '@/screens/feed/comment-composer';
import { CommentList } from '@/screens/feed/comment-list';
import {
  Image,
  ScrollView,
  Text,
  TimeWidget,
  TouchableOpacity,
  View,
} from '@/ui';
import { Ionicons } from '@/ui/icons/ionicons';
import { ImageViewer } from '@/ui/image-viewer';
import { getInitials } from '@/utils/get-initials';

type Props = RouteProp<RootStackParamList, 'FeedDetails'>;

export const FeedDetails = () => {
  const { params } = useRoute<Props>();
  const { post } = params;
  const {
    id,
    title,
    content,
    author,
    updoot,
    image,
    points,
    locationName,
    createdAt,
  } = post;

  const [imageModalVisible, setImageModalVisible] = React.useState(false);

  const { colorScheme } = useColorScheme();

  const isDark = colorScheme === 'dark';

  const [refreshing, setRefreshing] = React.useState(false);

  const iconColor = isDark ? 'text-neutral-400' : 'text-neutral-500';

  const isUpvoted = updoot !== undefined && updoot.value === 1;
  const isDownvoted = updoot !== undefined && updoot.value === -1;

  const onRefresh = async () => {
    setRefreshing(true);
  };

  return (
    <View className="flex-1">
      <ScrollView
        className="mb-24 flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="flex-1 space-y-3 bg-charcoal-900 pt-2">
          <View className="flex-row items-center space-x-2 px-4">
            <View className="h-[36px] w-[36px] items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600">
              {author?.image === null && (
                <Text
                  className="font-medium text-gray-600 dark:text-gray-300"
                  variant="xs"
                >
                  {getInitials(author.username)}
                </Text>
              )}
              {author?.image !== null && (
                <Image
                  source={{ uri: author?.image }}
                  className="h-[36px] w-[36px] rounded-full"
                />
              )}
            </View>

            <View className="flex-col justify-between">
              <View className="flex-row items-center space-x-2">
                <Text variant="sm" numberOfLines={3}>
                  {author?.username ?? ''}
                </Text>

                <TimeWidget
                  className="text-gray-600 dark:text-gray-500"
                  variant="xs"
                  time={createdAt!}
                />
              </View>

              <Text className="text-gray-600 dark:text-gray-300" variant="sm">
                {locationName}
              </Text>
            </View>
          </View>

          <Text className="px-4" variant="h3">
            {title}
          </Text>

          {post.content !== null && post.content !== undefined && (
            <Text variant="sm" className="px-4">
              {content}
            </Text>
          )}

          {image !== null && (
            <View className="px-4">
              <TouchableOpacity
                onPress={() => setImageModalVisible(true)}
                className="mt-1"
              >
                <Image
                  className="h-56 w-full object-cover"
                  source={{
                    uri: image,
                  }}
                />
              </TouchableOpacity>
              <ImageViewer
                images={[
                  {
                    uri: image!,
                  },
                ]}
                visible={imageModalVisible}
                onClose={() => setImageModalVisible(false)}
              />
            </View>
          )}

          <View className="flex-row justify-between px-10 py-4">
            <View className="flex-row items-center space-x-1">
              <Ionicons
                name="heart-outline"
                size={18}
                className={
                  isDownvoted
                    ? 'text-purple-500'
                    : isUpvoted
                    ? 'text-primary-400'
                    : iconColor
                }
              />

              <Text
                className={
                  'font-semibold' + isDownvoted
                    ? 'text-purple-500'
                    : isUpvoted
                    ? 'text-primary-400'
                    : 'text-gray-600 dark:text-gray-300'
                }
                variant="sm"
              >
                {points}
              </Text>
            </View>

            <View className="flex-row items-center space-x-1">
              <Ionicons
                name="chatbox-outline"
                size={16}
                className={iconColor}
              />

              <Text
                className="font-semibold text-gray-600 dark:text-gray-300"
                variant="sm"
              >
                {'2'}
              </Text>
            </View>

            <View className="flex-row items-center space-x-1">
              <Ionicons name="share-outline" size={16} className={iconColor} />

              <Text
                className="font-semibold text-gray-600 dark:text-gray-300"
                variant="sm"
              >
                Share
              </Text>
            </View>
          </View>

          <CommentList
            postId={post.id}
            refreshing={refreshing}
            onRefetchDone={() => setRefreshing(false)}
          />
        </View>
      </ScrollView>

      <View className="absolute bottom-0 z-50 h-fit w-full bg-charcoal-900 px-4">
        <CommentComposer postId={id} />
      </View>
    </View>
  );
};
