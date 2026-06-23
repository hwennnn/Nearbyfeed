import { type Post } from '../../types';

export type SharePostResult = 'clipboard' | 'native' | 'unsupported';

export type SharePostTarget = {
  clipboard?: Pick<Clipboard, 'writeText'>;
  href?: string;
  share?: (data: ShareData) => Promise<void>;
};

export const buildPostShareUrl = (
  postId: number,
  href = globalThis.location?.href ?? 'https://nearbyfeed.app/',
): string => {
  const url = new URL(href, 'https://nearbyfeed.app/');
  url.search = '';
  url.hash = '';
  url.searchParams.set('post', postId.toString());

  return url.toString();
};

export const buildPostShareText = (post: Post): string => {
  const content = post.content?.trim();
  if (content === undefined || content.length === 0) return post.title;

  return `${post.title} - ${content}`;
};

const getBrowserShareTarget = (): SharePostTarget => {
  const navigatorRef = globalThis.navigator;
  const shouldUseNativeShare =
    navigatorRef?.share !== undefined && navigatorRef.maxTouchPoints > 0;

  return {
    clipboard: navigatorRef?.clipboard,
    href: globalThis.location?.href,
    share: shouldUseNativeShare
      ? navigatorRef.share.bind(navigatorRef)
      : undefined,
  };
};

export const sharePost = async (
  post: Post,
  target: SharePostTarget = getBrowserShareTarget(),
): Promise<SharePostResult> => {
  const url = buildPostShareUrl(post.id, target.href);
  const text = buildPostShareText(post);

  if (target.share !== undefined) {
    await target.share({
      title: post.title,
      text,
      url,
    });

    return 'native';
  }

  if (target.clipboard !== undefined) {
    await target.clipboard.writeText(`${post.title}\n${url}`);
    return 'clipboard';
  }

  return 'unsupported';
};
