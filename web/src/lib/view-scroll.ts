type ScrollTarget = {
  scrollTo: (options: { left: number; top: number }) => void;
};

export const resetViewScrollPosition = ({
  root = document,
  win = window,
}: {
  root?: Document;
  win?: ScrollTarget;
} = {}) => {
  win.scrollTo({ left: 0, top: 0 });
  root
    .querySelector<HTMLElement>('.app-main')
    ?.scrollTo({ left: 0, top: 0 });
};
