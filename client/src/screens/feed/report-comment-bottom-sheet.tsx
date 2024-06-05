import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import * as React from 'react';

import { ReportReason } from '@/api';
import { useReportComment } from '@/api/reports';
import { useTheme } from '@/core';
import type { Option } from '@/ui';
import {
  ArrowRight,
  colors,
  showSuccessMessage,
  Text,
  TouchableOpacity,
  View,
} from '@/ui';
import { renderBackdrop } from '@/ui/core/bottom-sheet';
import Divider from '@/ui/core/divider';

type Props = {
  commentId: number;
  onClose: () => void;
};

export const ReportCommentBottomSheet = React.forwardRef<
  BottomSheetModal,
  Props
>(({ commentId, onClose }, optionsRef) => {
  const { mutate } = useReportComment({
    onMutate: () => {
      onClose();
    },
  });

  const onSelect = React.useCallback(
    (option: Option) => {
      mutate(
        {
          commentId: commentId.toString(),
          reason: option.value as ReportReason,
        },
        {
          onSuccess: () => {
            showSuccessMessage(
              "Thank you for your report! We'll review the comment to ensure it meets our community guidelines."
            );
          },
        }
      );
    },
    [mutate, commentId]
  );

  const options = React.useMemo(
    () => [
      { label: 'Spam', value: ReportReason.SPAM },
      {
        label: 'Harassment Or Bullying',
        value: ReportReason.HARASSMENT_OR_BULLYING,
      },
      { label: 'Hate Speech', value: ReportReason.HATE_SPEECH },
      {
        label: 'Violence Or Threats',
        value: ReportReason.VIOLENCE_OR_THREATS,
      },
      {
        label: 'Inappropriate Content',
        value: ReportReason.INAPPROPRIATE_CONTENT,
      },
      { label: 'False Information', value: ReportReason.FALSE_INFORMATION },
      {
        label: 'Copyright Infringement',
        value: ReportReason.COPYRIGHT_INFRINGEMENT,
      },
      { label: 'Privacy Violation', value: ReportReason.PRIVACY_VIOLATION },
      {
        label: 'Self Harm Or Suicide',
        value: ReportReason.SELF_HARM_OR_SUICIDE,
      },
      {
        label: 'Terrorism Or Extremism',
        value: ReportReason.TERRORISM_OR_EXTREMISM,
      },
    ],
    []
  );

  const height = options.length * 60 + 100;
  const snapPoints = React.useMemo(() => [height], [height]);
  const isDark = useTheme.use.colorScheme() === 'dark';

  const renderSelectItem = React.useCallback(
    ({ item }: { item: Option }) => (
      <TouchableOpacity
        className="flex-1 flex-row items-center justify-between bg-neutral-100 px-4 py-3 dark:bg-charcoal-850"
        onPress={() => onSelect(item)}
      >
        <Text>{item.label}</Text>

        <ArrowRight />
      </TouchableOpacity>
    ),
    [onSelect]
  );

  return (
    <BottomSheetModal
      ref={optionsRef}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{
        backgroundColor: isDark ? colors.white : colors.charcoal[800],
      }}
      backgroundStyle={{
        backgroundColor: isDark ? colors.charcoal[950] : colors.white,
      }}
    >
      <BottomSheetFlatList
        ListHeaderComponent={
          <View className="my-4 space-y-2 px-4">
            <Text variant="md" className="font-bold">
              Why are you reporting this comment?
            </Text>

            <Text variant="sm" className="text-gray-600 dark:text-gray-300">
              We take reports seriously to ensure our platform remains a
              positive environment for all users. Please let us know why you are
              reporting this post.
            </Text>
          </View>
        }
        data={options}
        keyExtractor={(item) => {
          return item.value;
        }}
        ItemSeparatorComponent={Divider}
        renderItem={renderSelectItem}
        style={{
          backgroundColor: isDark ? colors.charcoal[950] : colors.white,
        }}
      />
    </BottomSheetModal>
  );
});
