import { initials } from '../lib/format';

export const Avatar = ({
  image,
  name,
}: {
  image?: string | null;
  name?: string;
}) => (
  <span className="avatar">
    {image === null || image === undefined ? (
      initials(name)
    ) : (
      <img src={image} alt="" />
    )}
  </span>
);
