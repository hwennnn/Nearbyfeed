export type Post = {
  id: number;
  title: string;
  content?: string | null;
  latitude: number;
  longitude: number;
  locationName?: string | null;
  fullLocationName?: string | null;
  image?: string | null;
  points: number;
  createdAt?: Date;
  updatedAt?: Date;
  authorId?: number;
  author?: User;
  like?: PostLike;
  isOptimistic?: boolean;
  commentsCount: number;
};

export type Comment = {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  postId: number;
  points: number;
  authorId?: number;
  author?: User;
  isOptimistic?: boolean;
  parentCommentId: number | null;
  like?: CommentLike;
  repliesCount: number;
  replies: Comment[];
};

export type User = {
  id: number;
  username: string;
  email: string;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PostLike = {
  id: number;
  value: number;
  createdAt: Date;
  updatedAt: Date;
  postId: number;
  userId: number;
};

export type CommentLike = {
  id: number;
  value: number;
  createdAt: Date;
  updatedAt: Date;
  commentId: number;
  userId: number;
};

export type GeolocationName = {
  locationName: string;
  displayName: string;
};

export interface Place {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    building: string;
    house_number: string;
    road: string;
    suburb: string;
    city: string;
    county: string;
    'ISO3166-2-lvl6': string;
    postcode: string;
    country: string;
    country_code: string;
  };
  boundingbox: string[];
}
