import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DEFAULT_COMMENT_SORT, type ReportReason } from '@nearbyfeed/shared';
import { useState } from 'react';
import { type View } from '../../app-types';
import { addComment, captureEvent, fetchComments } from '../../lib/api';
import { type Comment, type CommentSort, type Post, type Session } from '../../types';
import { type BlockUserTarget } from '../moderation/block-types';
import { useBlockUserSubmission } from '../moderation/useBlockUserSubmission';
import { type ReportDialogTarget } from '../moderation/report-types';
import { useReportSubmission } from '../moderation/useReportSubmission';
import {
  getCommentBlockTarget,
  getCommentReportTarget,
  getPostBlockTarget,
  getPostReportTarget,
} from './details-trust';

export const useDetailsViewModel = ({
  post,
  session,
  setView,
}: {
  post: Post;
  session: Session | null;
  setView: (view: View) => void;
}) => {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [commentSort, setCommentSort] =
    useState<CommentSort>(DEFAULT_COMMENT_SORT);
  const [reportTarget, setReportTarget] =
    useState<ReportDialogTarget | null>(null);
  const [reportNotice, setReportNotice] = useState<string | null>(null);
  const [blockTarget, setBlockTarget] = useState<BlockUserTarget | null>(null);
  const [blockNotice, setBlockNotice] = useState<string | null>(null);
  const commentsQuery = useQuery({
    queryKey: ['comments', post.id, commentSort],
    queryFn: async () => await fetchComments(post.id, commentSort),
    enabled: post.id < 9000,
  });
  const addCommentMutation = useMutation({
    mutationFn: async () => await addComment(post.id, comment.trim()),
    onSuccess: async () => {
      void captureEvent('web.comment_created', { postId: post.id }, 'details');
      setComment('');
      await queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
  const reportMutation = useReportSubmission({
    onSuccess: (message) => {
      setReportNotice(message);
      setReportTarget(null);
    },
  });
  const blockMutation = useBlockUserSubmission({
    onSuccess: (message) => {
      setBlockNotice(message);
      setBlockTarget(null);
    },
  });
  const comments: Comment[] = commentsQuery.data?.comments ?? [];
  const detailPost = {
    ...post,
    commentsCount: Math.max(post.commentsCount, comments.length),
  };
  const postBlockTarget = getPostBlockTarget(detailPost, session);
  const openReportDialog = (target: ReportDialogTarget) => {
    reportMutation.reset();
    setReportNotice(null);
    setReportTarget(target);
  };
  const openBlockDialog = (target: BlockUserTarget | null) => {
    if (target === null) return;
    blockMutation.reset();
    setBlockNotice(null);
    setBlockTarget(target);
  };
  const closeReportDialog = () => {
    if (reportMutation.isPending) return;
    reportMutation.reset();
    setReportTarget(null);
  };
  const closeBlockDialog = () => {
    if (blockMutation.isPending) return;
    blockMutation.reset();
    setBlockTarget(null);
  };
  const requireAuth = () => setView('profile');

  return {
    blockErrorMessage:
      blockMutation.error instanceof Error ? blockMutation.error.message : null,
    blockNotice,
    blockTarget,
    canBlockComment: (targetComment: Comment) =>
      getCommentBlockTarget(targetComment, session) !== null,
    closeBlockDialog,
    closeReportDialog,
    comment,
    commentSort,
    comments,
    confirmBlock: () => {
      if (session === null || blockTarget === null) return;
      blockMutation.mutate({
        currentUserId: session.user.id,
        target: blockTarget,
      });
    },
    detailPost,
    isBlocking: blockMutation.isPending,
    isPostingComment: addCommentMutation.isPending,
    isReporting: reportMutation.isPending,
    onBlockComment: (targetComment: Comment) =>
      openBlockDialog(getCommentBlockTarget(targetComment, session)),
    onBlockPost:
      postBlockTarget === null ? undefined : () => openBlockDialog(postBlockTarget),
    onCommentChange: setComment,
    onCommentSortChange: setCommentSort,
    onReportComment: (targetComment: Comment) =>
      openReportDialog(getCommentReportTarget(targetComment)),
    onReportPost: () => openReportDialog(getPostReportTarget(detailPost)),
    onSubmitComment: () => addCommentMutation.mutate(),
    reportErrorMessage:
      reportMutation.error instanceof Error
        ? reportMutation.error.message
        : null,
    reportNotice,
    reportTarget,
    requireAuth,
    signedIn: session !== null,
    submitReport: (reason: ReportReason) => {
      if (reportTarget === null) return;
      reportMutation.mutate({ reason, target: reportTarget });
    },
  };
};
