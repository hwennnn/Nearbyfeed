import { useMutation, useQueryClient } from '@tanstack/react-query';
import { blockUser, captureEvent } from '../../lib/api';
import { getBlockSuccessMessage } from './block-presentation';
import { type BlockSubmissionInput } from './block-types';

export const useBlockUserSubmission = ({
  onSuccess,
}: {
  onSuccess: (message: string) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, BlockSubmissionInput>({
    mutationFn: async ({ currentUserId, target }) => {
      await blockUser({
        blockedId: target.userId,
        userId: currentUserId,
      });
    },
    onSuccess: async (_data, variables) => {
      void captureEvent(
        'web.user_muted',
        {
          source: variables.target.kind,
          targetUserId: variables.target.userId,
        },
        'details',
      );
      await queryClient.invalidateQueries({ queryKey: ['self'] });
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      await queryClient.invalidateQueries({ queryKey: ['comments'] });
      onSuccess(getBlockSuccessMessage(variables.target.username));
    },
  });
};
