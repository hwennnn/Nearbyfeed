export type Post = {
  id: number;
  title: string;
  content: string | null;
  latitude: number;
  longitude: number;
  locationName: string | null;
  fullLocationName: string | null;
  image: string | null;
  points: number;
  flagged: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
};

export type Comment = {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  postId: number;
  authorId: number;
};
