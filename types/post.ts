// Post-related TypeScript types

export interface PostMedia {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  displayOrder: number;
  width?: number;
  height?: number;
}

export interface PostUser {
  soleUserId: string;
  username: string;
  name: string;
  profilePic: string | null;
}

export interface Post {
  id: string;
  soleUserId: string;
  content: string;
  createdAt: string;
  media: PostMedia[];
  likeCount: number;
  commentCount: number;
  isLikedByUser: boolean;
  soleUserInfo: PostUser;
  location?: string;
  hashtags?: string[];
  mentions?: string[];
}

export interface Comment {
  id: string;
  postId: string;
  soleUserId: string;
  content: string;
  createdAt: string;
  soleUserInfo: PostUser;
}

