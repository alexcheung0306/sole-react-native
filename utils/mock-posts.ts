import { Post } from '~/types/post';

// Mock post data for development
export const mockPosts: Post[] = [
  {
    id: '1',
    soleUserId: 'user1',
    content: 'Beautiful sunset at the beach 🌅 #sunset #beach #nature',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    media: [
      {
        id: 'm1',
        mediaUrl: 'https://picsum.photos/1080/1350?random=1', // 4:5 ratio (portrait)
        mediaType: 'image',
        displayOrder: 0,
        width: 1080,
        height: 1350,
      },
    ],
    likeCount: 42,
    commentCount: 5,
    isLikedByUser: false,
    soleUserInfo: {
      soleUserId: 'user1',
      username: 'naturelover',
      name: 'Nature Lover',
      profilePic: 'https://i.pravatar.cc/150?img=1',
    },
    location: 'Santa Monica Beach',
    hashtags: ['sunset', 'beach', 'nature'],
  },
  {
    id: '2',
    soleUserId: 'user2',
    content: 'City vibes 🏙️ Multiple shots from my weekend adventure!',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    media: [
      {
        id: 'm2',
        mediaUrl: 'https://picsum.photos/1080/1080?random=2', // 1:1 ratio (square)
        mediaType: 'image',
        displayOrder: 0,
        width: 1080,
        height: 1080,
      },
      {
        id: 'm3',
        mediaUrl: 'https://picsum.photos/1080/1080?random=3',
        mediaType: 'image',
        displayOrder: 1,
        width: 1080,
        height: 1080,
      },
      {
        id: 'm4',
        mediaUrl: 'https://picsum.photos/1080/1080?random=4',
        mediaType: 'image',
        displayOrder: 2,
        width: 1080,
        height: 1080,
      },
    ],
    likeCount: 128,
    commentCount: 12,
    isLikedByUser: true,
    soleUserInfo: {
      soleUserId: 'user2',
      username: 'cityphotographer',
      name: 'City Photographer',
      profilePic: 'https://i.pravatar.cc/150?img=2',
    },
    location: 'Downtown LA',
    hashtags: ['city', 'urban', 'photography'],
    mentions: ['@architecturelover'],
  },
  {
    id: '3',
    soleUserId: 'user3',
    content: 'New project announcement! So excited to share this with you all 🎉',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    media: [
      {
        id: 'm5',
        mediaUrl: 'https://picsum.photos/1920/1080?random=5', // 16:9 ratio (landscape)
        mediaType: 'image',
        displayOrder: 0,
        width: 1920,
        height: 1080,
      },
    ],
    likeCount: 256,
    commentCount: 34,
    isLikedByUser: false,
    soleUserInfo: {
      soleUserId: 'user3',
      username: 'creativestudio',
      name: 'Creative Studio',
      profilePic: 'https://i.pravatar.cc/150?img=3',
    },
    location: 'Los Angeles, CA',
    hashtags: ['announcement', 'project', 'creative'],
  },
  {
    id: '4',
    soleUserId: 'user4',
    content: 'Morning coffee ☕ Starting the day right!',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    media: [
      {
        id: 'm6',
        mediaUrl: 'https://picsum.photos/1080/1350?random=6', // 4:5 ratio
        mediaType: 'image',
        displayOrder: 0,
        width: 1080,
        height: 1350,
      },
    ],
    likeCount: 89,
    commentCount: 8,
    isLikedByUser: true,
    soleUserInfo: {
      soleUserId: 'user4',
      username: 'coffeeaddict',
      name: 'Coffee Addict',
      profilePic: 'https://i.pravatar.cc/150?img=4',
    },
    hashtags: ['coffee', 'morning', 'lifestyle'],
  },
  {
    id: '5',
    soleUserId: 'user5',
    content: 'Travel memories 🌍✈️ Throwback to last summer',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    media: [
      {
        id: 'm7',
        mediaUrl: 'https://picsum.photos/1920/1080?random=7',
        mediaType: 'image',
        displayOrder: 0,
        width: 1920,
        height: 1080,
      },
      {
        id: 'm8',
        mediaUrl: 'https://picsum.photos/1920/1080?random=8',
        mediaType: 'image',
        displayOrder: 1,
        width: 1920,
        height: 1080,
      },
    ],
    likeCount: 342,
    commentCount: 45,
    isLikedByUser: false,
    soleUserInfo: {
      soleUserId: 'user5',
      username: 'worldtraveler',
      name: 'World Traveler',
      profilePic: 'https://i.pravatar.cc/150?img=5',
    },
    location: 'Paris, France',
    hashtags: ['travel', 'explore', 'wanderlust'],
    mentions: ['@travelbuddy'],
  },
];

// Function to generate more mock posts (for infinite scroll)
export const generateMockPosts = (startIndex: number, count: number): Post[] => {
  return Array.from({ length: count }, (_, i) => {
    const index = startIndex + i;
    const imageCount = Math.floor(Math.random() * 3) + 1; // 1-3 images
    const aspectRatios = [
      { width: 1080, height: 1350 }, // 4:5 portrait
      { width: 1080, height: 1080 }, // 1:1 square
      { width: 1920, height: 1080 }, // 16:9 landscape
    ];
    const randomRatio = aspectRatios[Math.floor(Math.random() * aspectRatios.length)];

    return {
      id: `post-${index}`,
      soleUserId: `user-${index}`,
      content: `This is post #${index + 1} with some interesting content! ${['🎨', '📸', '✨', '🌟', '💫'][index % 5]}`,
      createdAt: new Date(Date.now() - (index + 1) * 60 * 60 * 1000).toISOString(),
      media: Array.from({ length: imageCount }, (_, mediaIndex) => ({
        id: `m-${index}-${mediaIndex}`,
        mediaUrl: `https://picsum.photos/${randomRatio.width}/${randomRatio.height}?random=${index * 10 + mediaIndex}`,
        mediaType: 'image' as const,
        displayOrder: mediaIndex,
        width: randomRatio.width,
        height: randomRatio.height,
      })),
      likeCount: Math.floor(Math.random() * 500),
      commentCount: Math.floor(Math.random() * 50),
      isLikedByUser: Math.random() > 0.5,
      soleUserInfo: {
        soleUserId: `user-${index}`,
        username: `user${index}`,
        name: `User ${index}`,
        profilePic: `https://i.pravatar.cc/150?img=${(index % 70) + 1}`,
      },
      hashtags: ['photography', 'art', 'creative'].slice(0, Math.floor(Math.random() * 3) + 1),
    };
  });
};

