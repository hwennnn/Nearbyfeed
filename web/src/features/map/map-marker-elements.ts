import { type Post } from '../../types';
import {
  type LiveMapSignal,
  getMapMarkerLabel,
  getMapPostSignalLabel,
  getMapPostTone,
} from './map-presentation';

export const createPostMarkerElement = ({
  onSelectPost,
  post,
  selectedPostId,
}: {
  onSelectPost: (postId: number) => void;
  post: Post;
  selectedPostId: number | null;
}): HTMLButtonElement => {
  const element = document.createElement('button');
  const label = document.createElement('span');
  const tone = getMapPostTone(post);

  element.className = [
    'nf-marker',
    `is-${tone}`,
    post.id === selectedPostId ? 'is-selected' : '',
  ]
    .filter(Boolean)
    .join(' ');
  element.type = 'button';
  element.setAttribute(
    'aria-label',
    `${post.title}, ${getMapPostSignalLabel(post)}`,
  );
  label.textContent = getMapMarkerLabel(post);
  element.append(label);
  element.addEventListener('click', () => onSelectPost(post.id));

  return element;
};

export const createLiveSignalMarkerElement = (
  signal: LiveMapSignal,
): HTMLAnchorElement => {
  const element = document.createElement('a');
  const source = document.createElement('span');
  const label = document.createElement('strong');
  const title = document.createElement('span');

  element.className = `nf-live-marker is-${signal.tone}`;
  element.href = signal.url;
  element.rel = 'noreferrer';
  element.target = '_blank';
  element.setAttribute(
    'aria-label',
    `Approximate ${signal.sourceLabel} signal: ${signal.title}, ${signal.label}`,
  );
  element.addEventListener('click', (event) => event.stopPropagation());

  source.className = 'nf-live-marker-source';
  source.textContent = 'X';
  label.textContent = signal.label;
  title.className = 'nf-live-marker-title';
  title.textContent = signal.title;

  element.append(source, label, title);

  return element;
};
