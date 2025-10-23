# 📸 Post/Profile Page Implementation Guide - Complete Technical Breakdown

## 🎯 OVERVIEW
This document explains how the **User Profile/Posts page** works - how it displays user posts in a grid, handles infinite scrolling, and manages post interactions (likes, comments). This covers both the profile view and the post modal system.

---

## 📂 FILE STRUCTURE

### Main Pages
- **User Profile Page**: `/src/app/(home)/user/[username]/page.tsx`
- Dynamic route that shows any user's profile and posts

### Components
- **UserPost Modal**: `/src/app/(home)/_components/userProfile/_postComponents/user-post-modal.tsx`
- **Post Header**: `/src/app/(home)/_components/userProfile/_postComponents/post-header.tsx`
- **Like Toggle Button**: `/src/app/(home)/_components/userProfile/_postComponents/like-toggle-button.tsx`
- **Comment Input**: `/src/app/(home)/_components/userProfile/_postComponents/comment-input.tsx`
- **Post Comments List**: `/src/app/(home)/_components/userProfile/_postComponents/post-comment-list-lazy.tsx`
- **Post Likes List**: `/src/app/(home)/_components/userProfile/_postComponents/post-likes-list-lazy.tsx`
- **UserInfo**: `/src/app/(home)/_components/userProfile/_userInfoComponents/userInfo.tsx`
- **ProfileTabs**: `/src/app/(home)/_components/userProfile/_components/profile-tabs.tsx`

### Custom Hooks
- **useUserPostQueries**: `/src/hooks/useUserPostQueries.ts`
- Handles all post fetching for profile, home, and explore pages

### API Services
- **Post API**: `/src/app/api/apiservice/post_api.ts`
- Comprehensive post, like, and comment management

---

## 🔄 DATA FLOW ARCHITECTURE

```
User visits /user/{username}
    ↓
Profile page loads user data via getUserProfileByUsername()
    ↓
useUserPostQueries hook triggers with soleUserId
    ↓
API: GET /api/post/search?soleUserId={id}&pageNo=0&pageSize=9&orderBy=createdAt&orderSeq=desc
    ↓
Server returns paginated posts with media, like count, comment count
    ↓
enrichPostsWithDimensions() calculates aspect ratios
    ↓
Posts rendered in 3-column grid
    ↓
User scrolls → InfiniteScroll triggers fetchNextPage
    ↓
Loads more posts (page 1, 2, 3...)
    ↓
User clicks post → Modal opens with full details
    ↓
User can like, comment, view all interactions
```

---

## 📄 1. USER PROFILE PAGE

### Location
`/src/app/(home)/user/[username]/page.tsx`

### What It Does
- Displays user profile information (avatar, bio, stats)
- Shows user's posts in a 3-column grid
- Implements infinite scroll for loading more posts
- Has tabs for Posts, Talent Info, and Jobs

### Key Features

#### A. Dynamic Route Parameters
```typescript
export default function UserProfile({ params }) {
  const { username }: any = use(params) // Next.js 15 App Router syntax
}
```

#### B. User Profile Data Fetching
```typescript
const {
  data: userProfileData,
  isLoading: userProfileIsLoading,
  error: userProfileError,
  refetch,
} = useQuery({
  queryKey: ["userProfile", username],
  queryFn: async () => {
    if (!user) {
      throw new Error("User not found")
    }
    const result: any = await getUserProfileByUsername(username)
    if (user?.username === username) {
      setIsUser(true) // Current user viewing own profile
    } else {
      setIsUser(false) // Viewing someone else's profile
    }
    return result
  },
  staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  enabled: !!user && !!username && username != undefined,
  refetchOnWindowFocus: false,
})
```

**API Endpoint**:
```
GET /api/user-info/username/{username}
```

**Response Structure**:
```typescript
{
  userInfo: {
    soleUserId: string,
    username: string,
    name: string,
    profilePic: string,
    bio: string,
    category: string,
    // ... more fields
  },
  talentLevel: string | null,
  clientLevel: string | null,
  // ... additional user data
}
```

#### C. Posts Data Fetching with Infinite Scroll

Uses the custom hook `useUserPostQueries`:

```typescript
const {
  userPostsData: userPostsData,
  userFetchNextPage: userFetchNextPage,
  userHasNextPage: userHasNextPage,
  userIsFetchingNextPage: userIsFetchingNextPage,
  userIsLoading: userIsLoading,
  userIsError: userIsError,
  userError: userError,
} = useUserPostQueries({
  username,
  userProfileData,
  pageSize: 9, // 3x3 grid
})
```

**Flatten pages into single array**:
```typescript
const posts = userPostsData?.pages.flatMap((page) => page.data) ?? []
const totalPosts = userPostsData?.pages[0]?.total ?? 0
```

#### D. Profile Tabs System

```typescript
const [profileTab, setProfileTab] = useState("posts")

<ProfileTabs
  isLoading={userProfileIsLoading}
  profileTab={profileTab}
  setProfileTab={setProfileTab}
/>

{profileTab === "posts" && (
  <div className="grid grid-cols-3 gap-1">
    {posts.map((post, index) => (
      <UserPost
        key={post.id}
        index={index}
        post={post}
        isLoading={userIsLoading}
        type="card"
        dimensionType={post.dimensionType}
      />
    ))}
  </div>
)}
```

**Tab Options**:
- `"posts"` - User's post grid
- `"talent"` - Talent profile info (if user has talent level)
- `"jobs"` - Applied jobs and contracts

---

## 🔧 2. useUserPostQueries HOOK

### Location
`/src/hooks/useUserPostQueries.ts`

### What It Does
**Single hook that handles THREE different post queries**:
1. **Profile Posts** - Posts by specific user (for profile page)
2. **Home Feed Posts** - All posts from followed users (for home page)
3. **Explore Posts** - All public posts (for explore page)

### Why This Architecture?
- **Code Reusability**: One hook handles multiple similar queries
- **Consistent Behavior**: All post pages work the same way
- **Easy Maintenance**: Change pagination logic once, affects all pages

### Profile Posts Query (userPostsData)

```typescript
const {
  data: userPostsData,
  fetchNextPage: userFetchNextPage,
  hasNextPage: userHasNextPage,
  isFetchingNextPage: userIsFetchingNextPage,
  isLoading: userIsLoading,
  isError: userIsError,
  error: userError,
} = useInfiniteQuery({
  queryKey: ["profilePagePosts", username],
  queryFn: async ({ pageParam = 0 }) => {
    const response = await searchPosts({
      soleUserId: userProfileData?.userInfo?.soleUserId,
      content: "",
      pageNo: pageParam,
      pageSize,
      orderBy: "createdAt",
      orderSeq: "desc",
    })

    // Enrich posts with dimension type and calculated ratio
    const enrichedData = await enrichPostsWithDimensions(response.data)

    return {
      ...response,
      data: enrichedData,
    }
  },
  enabled: !!userProfileData?.userInfo?.soleUserId,
  getNextPageParam: (lastPage, allPages) => {
    const currentPage = allPages.length - 1
    const loadedItems = allPages.reduce(
      (sum, page) => sum + page.data.length,
      0
    )
    // Check if there are more items to load
    if (loadedItems < lastPage.total) {
      return currentPage + 1
    }
    return undefined
  },
  initialPageParam: 0,
})
```

### Key Concepts

#### A. useInfiniteQuery
- **From TanStack Query** (React Query)
- Automatically handles paginated data
- Provides `fetchNextPage()` function
- Manages all pages in a single data structure

#### B. enrichPostsWithDimensions Function

**Purpose**: Pre-calculate image aspect ratios for responsive display

```typescript
async function enrichPostsWithDimensions(
  posts: PostWithDetailsResponse[]
): Promise<PostWithDetailsResponse[]> {
  const enrichedPosts = await Promise.all(
    posts.map(async (post) => {
      if (post.media && post.media.length > 0) {
        try {
          const firstMediaUrl = post.media[0].mediaUrl
          
          const ratio = await getAspectRatioFromUrl(firstMediaUrl)
          const dimensionType = getDimensionType(ratio)

          return {
            ...post,
            calculatedRatio: ratio, // "16/9", "1/1", "4/5"
            dimensionType, // "landscape", "square", "portrait"
          }
        } catch (error) {
          return {
            ...post,
            calculatedRatio: null,
            dimensionType: "square",
          }
        }
      }
      return {
        ...post,
        calculatedRatio: null,
        dimensionType: "square",
      }
    })
  )

  return enrichedPosts
}
```

**Why?**:
- Images load with correct aspect ratio immediately
- No layout shifts or content jumps
- Better UX and performance

#### C. getNextPageParam Logic

**How it works**:
```typescript
getNextPageParam: (lastPage, allPages) => {
  const currentPage = allPages.length - 1
  const loadedItems = allPages.reduce(
    (sum, page) => sum + page.data.length,
    0
  )
  
  // If we've loaded fewer items than total, there are more pages
  if (loadedItems < lastPage.total) {
    return currentPage + 1 // Return next page number
  }
  return undefined // No more pages
}
```

**Example**:
- Total posts: 27
- Page size: 9
- Page 0 loads: 9 posts (9 < 27, next = 1)
- Page 1 loads: 9 posts (18 < 27, next = 2)
- Page 2 loads: 9 posts (27 = 27, next = undefined, DONE)

---

## 🖼️ 3. POST DISPLAY COMPONENTS

### A. UserPost Component (Card View)

**File**: `/src/app/(home)/_components/userProfile/_postComponents/user-post-modal.tsx`

**Two Display Modes**:

#### Mode 1: Card (Grid Thumbnail)
```typescript
{type == "card" && imageUrls.length > 0 && (
  <Card
    shadow="none"
    radius="sm"
    isPressable
    className="w-full aspect-square overflow-hidden"
    onPress={onOpenModal}
  >
    <img
      src={imageUrls[0]}
      alt={`Post by user ${post.soleUserId}`}
      className="w-full h-full object-cover"
    />
  </Card>
)}
```

**Features**:
- Shows first image only
- Square aspect ratio (aspect-square class)
- Clickable to open modal
- Lazy loading with Skeleton

#### Mode 2: Button (Comment Icon)
```typescript
{type == "button" && (
  <MessageCircle
    onClick={onOpenModal}
    className="cursor-pointer"
  />
)}
```

**Used in**: Home/feed view to open comments

### B. Post Modal (Full Post View)

**Triggered by**: Clicking a post card

**Modal Structure**:
```
┌─────────────────────────────────────────────┐
│  Post Header (User info, timestamp)        │
├─────────────────────────────────────────────┤
│                                             │
│  Image Carousel (swipeable)                │
│  (if multiple images/videos)               │
│                                             │
├─────────────────────────────────────────────┤
│  Post Content (caption)                    │
├─────────────────────────────────────────────┤
│  Tabs: [Likes] [Comments]                  │
├─────────────────────────────────────────────┤
│  Like Button | Comment Count               │
├─────────────────────────────────────────────┤
│  Comment Input (Add comment)               │
├─────────────────────────────────────────────┤
│  Comments List (paginated)                 │
└─────────────────────────────────────────────┘
```

**Modal Implementation**:
```typescript
<Modal
  isOpen={isOpenModal}
  onOpenChange={onOpenChangeModal}
  size="4xl"
  scrollBehavior="inside"
>
  <ModalContent>
    <ModalHeader>
      <PostHeader post={post} />
    </ModalHeader>
    
    <ModalBody>
      {/* Image Carousel */}
      <CarouselDisplayOnly
        images={imageUrls}
        calculatedRatio={calculatedRatio}
      />
      
      {/* Post Content */}
      <p>{post.content}</p>
      
      {/* Tabs */}
      <Tabs selectedKey={selectedTab}>
        <Tab key="likes" title={`Likes (${post.likeCount})`}>
          <PostLikesListLazy postId={post.id} />
        </Tab>
        <Tab key="comments" title={`Comments (${post.commentCount})`}>
          <PostCommentsListLazy postId={post.id} />
        </Tab>
      </Tabs>
      
      {/* Like/Comment Actions */}
      <div className="flex gap-4">
        <LikeToggleButton post={post} soleUserId={soleUserId} />
        <span>{post.likeCount} likes</span>
      </div>
      
      {/* Comment Input */}
      <CommentInput
        postId={post.id}
        onCommentSubmit={handleCommentSubmit}
      />
    </ModalBody>
  </ModalContent>
</Modal>
```

---

## 💝 4. LIKE SYSTEM

### API Endpoints

#### A. Toggle Like
```
POST /api/post-likes/toggle/{postId}/{soleUserId}
```

**Returns**: `boolean` (true if liked, false if unliked)

#### B. Check if Liked
```
GET /api/post-likes/check/{postId}/{soleUserId}
```

**Returns**: `boolean`

#### C. Get Likes with User Info (Paginated)
```
GET /api/post-likes/post/{postId}/paginated?page=0&size=10&sortDirection=desc
```

**Returns**:
```typescript
{
  content: [
    {
      id: number,
      postId: number,
      soleUserId: string,
      username: string,
      profilePic: string,
      createdAt: string,
      updatedAt: string,
    }
  ],
  totalElements: number,
  totalPages: number,
  size: number,
  number: number,
  first: boolean,
  last: boolean,
}
```

### LikeToggleButton Component

**File**: `/src/app/(home)/_components/userProfile/_postComponents/like-toggle-button.tsx`

**Implementation**:
```typescript
export function LikeToggleButton({ post, soleUserId }) {
  const queryClient = useQueryClient()
  
  // Check if post is liked
  const { data: isLiked } = useQuery({
    queryKey: ["postLike", post.id, soleUserId],
    queryFn: () => checkIfPostIsLiked(post.id, soleUserId),
    enabled: !!post.id && !!soleUserId,
  })
  
  // Toggle like mutation
  const likeMutation = useMutation({
    mutationFn: () => togglePostLike(post.id, soleUserId),
    onSuccess: () => {
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["postLike"] })
      queryClient.invalidateQueries({ queryKey: ["homePagePosts"] })
      queryClient.invalidateQueries({ queryKey: ["profilePagePosts"] })
    },
  })
  
  return (
    <Button
      isIconOnly
      variant="light"
      onPress={() => likeMutation.mutate()}
    >
      <Heart
        fill={isLiked ? "red" : "none"}
        stroke={isLiked ? "red" : "currentColor"}
      />
    </Button>
  )
}
```

**Key Features**:
- **Optimistic UI**: Immediate visual feedback
- **Query Invalidation**: Automatically refreshes like counts
- **State Persistence**: Likes are saved to database

---

## 💬 5. COMMENT SYSTEM

### API Endpoints

#### A. Create Comment
```
POST /api/post-comments
Content-Type: application/json

{
  "postId": 123,
  "soleUserId": "user_abc",
  "comment": "Great post!"
}
```

#### B. Get Comments with User Info (Paginated)
```
GET /api/post-comments/post/{postId}/paginated?page=0&size=10&sortDirection=desc
```

**Returns**:
```typescript
{
  content: [
    {
      id: number,
      postId: number,
      soleUserId: string,
      comment: string,
      username: string,
      profilePic: string,
      createdAt: string,
      updatedAt: string,
    }
  ],
  totalElements: number,
  totalPages: number,
  size: number,
  number: number,
  first: boolean,
  last: boolean,
}
```

#### C. Delete Comment
```
DELETE /api/post-comments/{commentId}
```

### Comment Input Component

**File**: `/src/app/(home)/_components/userProfile/_postComponents/comment-input.tsx`

**Implementation**:
```typescript
export function CommentInput({ postId, onCommentSubmit }) {
  const [comment, setComment] = useState("")
  
  const handleSubmit = () => {
    if (!comment.trim()) return
    onCommentSubmit(comment)
    setComment("")
  }
  
  return (
    <div className="flex gap-2">
      <Input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment..."
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            handleSubmit()
          }
        }}
      />
      <Button onPress={handleSubmit}>Post</Button>
    </div>
  )
}
```

### Comment Creation Mutation

**In UserPost Component**:
```typescript
const createCommentMutation = useMutation({
  mutationFn: (comment: string) =>
    createPostComment(post.id, soleUserId, comment),
  onSuccess: () => {
    // Invalidate queries to refresh comments
    queryClient.invalidateQueries({
      queryKey: ["homePagePosts"],
    })
    queryClient.invalidateQueries({
      queryKey: ["post-comments", post.id],
    })
  },
  onError: (error) => {
    console.error("Error creating comment:", error)
  },
})

const handleCommentSubmit = (comment: string) => {
  if (!comment.trim() || !post.id || !soleUserId) {
    return
  }
  createCommentMutation.mutate(comment)
}
```

---

## 📊 6. POST DATA MODEL

### Post Object (PostWithDetailsResponse)
```typescript
{
  // Basic post info
  id: number,
  soleUserId: string,
  content: string,
  createdAt: string,
  updatedAt: string,
  
  // Media
  media: [
    {
      id: number,
      postId: number,
      mediaUrl: string,
      displayOrder: number,
      fileName: string,
      fileSize: number,
      mediaType: string, // "image/jpeg", "video/mp4"
      isActive: boolean,
      createdAt: string,
      updatedAt: string,
    }
  ],
  
  // Counts
  likeCount: number,
  commentCount: number,
  mediaCount: number,
  
  // Calculated fields (added by enrichPostsWithDimensions)
  dimensionType: "landscape" | "portrait" | "square",
  calculatedRatio: string | null, // "16/9", "1/1", "4/5"
  
  // User info
  soleUserInfo: {
    soleUserId: string,
    username: string,
    name: string,
    profilePic: string,
    talentLevel: string | null,
    clientLevel: string | null,
  }
}
```

---

## 🚀 7. INFINITE SCROLL IMPLEMENTATION

### Using react-infinite-scroll-component

```typescript
import InfiniteScroll from "react-infinite-scroll-component"

<InfiniteScroll
  dataLength={posts.length}
  next={userFetchNextPage}
  hasMore={userHasNextPage ?? false}
  scrollableTarget="scrollableDiv" // Defined in layout
  loader={
    <div className="flex justify-center py-4">
      <Spinner size="md" label="Loading more posts..." />
    </div>
  }
  endMessage={
    <div className="text-center py-4 text-gray-500">
      <p>Showing all {totalPosts} posts</p>
    </div>
  }
>
  <div className="grid grid-cols-3 gap-1">
    {posts.map((post, index) => (
      <UserPost
        key={post.id}
        index={index}
        post={post}
        type="card"
        dimensionType={post.dimensionType}
      />
    ))}
  </div>
</InfiniteScroll>
```

**How it Works**:
1. User scrolls to bottom
2. `next` function is called (`userFetchNextPage`)
3. TanStack Query fetches next page
4. New posts are added to `posts` array
5. `dataLength` increases
6. If `hasMore` is false, shows end message

---

## 🛠️ 8. IMPLEMENTATION CHECKLIST

### Step 1: Set Up API Functions
```typescript
- [ ] searchPosts(params) - Search/filter posts
- [ ] getPostWithDetailsById(id) - Get single post
- [ ] togglePostLike(postId, soleUserId) - Toggle like
- [ ] checkIfPostIsLiked(postId, soleUserId) - Check like status
- [ ] createPostComment(postId, soleUserId, comment) - Add comment
- [ ] getPostCommentsWithUserInfoPaginated(postId, page, size) - Get comments
- [ ] getPostLikesWithUserInfoPaginated(postId, page, size) - Get likes
```

### Step 2: Create useUserPostQueries Hook
```typescript
- [ ] Set up useInfiniteQuery for profile posts
- [ ] Implement enrichPostsWithDimensions function
- [ ] Configure getNextPageParam logic
- [ ] Export all query states and functions
```

### Step 3: Build Profile Page
```typescript
- [ ] Set up dynamic route [username]
- [ ] Fetch user profile data
- [ ] Integrate useUserPostQueries hook
- [ ] Implement profile tabs
- [ ] Add infinite scroll
```

### Step 4: Create UserPost Component
```typescript
- [ ] Build card view (thumbnail)
- [ ] Build modal view (full post)
- [ ] Implement image carousel
- [ ] Add like/comment sections
```

### Step 5: Implement Like System
```typescript
- [ ] Create LikeToggleButton component
- [ ] Add useMutation for toggle
- [ ] Implement query invalidation
- [ ] Style filled/unfilled heart
```

### Step 6: Implement Comment System
```typescript
- [ ] Create CommentInput component
- [ ] Add useMutation for create
- [ ] Build comments list with pagination
- [ ] Add delete functionality (optional)
```

### Step 7: Optimize Performance
```typescript
- [ ] Pre-calculate image aspect ratios
- [ ] Implement lazy loading for images
- [ ] Add skeleton loaders
- [ ] Optimize query caching
```

---

## 🔑 KEY TECHNICAL CONCEPTS

### 1. TanStack Query useInfiniteQuery
**Why?**:
- Automatic pagination management
- Built-in loading states
- Cache management
- Query invalidation

### 2. Aspect Ratio Pre-calculation
**Why?**:
- Prevents layout shifts
- Smooth scrolling experience
- Better performance

### 3. Query Invalidation Pattern
**After mutation** (like, comment):
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["homePagePosts"] })
  queryClient.invalidateQueries({ queryKey: ["profilePagePosts"] })
  queryClient.invalidateQueries({ queryKey: ["post-comments", postId] })
}
```

**Result**: All affected queries refetch automatically

### 4. Lazy Loading Components
```typescript
import dynamic from 'next/dynamic'

const PostCommentsListLazy = dynamic(
  () => import('./post-comment-list'),
  { loading: () => <Spinner /> }
)
```

**Why?**:
- Reduces initial bundle size
- Loads components only when needed

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue 1: Images Not Loading in Grid
**Cause**: Aspect ratio not calculated
**Solution**: Ensure `enrichPostsWithDimensions()` runs before rendering

### Issue 2: Infinite Scroll Not Triggering
**Cause**: `scrollableTarget` not set correctly
**Solution**: Set `scrollableTarget="scrollableDiv"` and ensure parent has this ID

### Issue 3: Likes/Comments Not Updating
**Cause**: Query not invalidated after mutation
**Solution**: Add `queryClient.invalidateQueries()` in `onSuccess`

### Issue 4: Modal Not Opening
**Cause**: useDisclosure not set up
**Solution**: Use `const { isOpen, onOpen, onClose } = useDisclosure()`

---

## 📝 SUMMARY

### Data Flow
1. **Fetch user profile** → Get user info and ID
2. **Fetch posts** → Paginated query with soleUserId filter
3. **Enrich posts** → Calculate aspect ratios for display
4. **Render grid** → 3-column layout with infinite scroll
5. **User interaction** → Likes/comments trigger mutations
6. **Query invalidation** → UI automatically updates

### Key Features
- **Infinite Scrolling**: Load more as user scrolls
- **Aspect Ratio Optimization**: Pre-calculated for smooth rendering
- **Real-time Updates**: Mutations invalidate queries
- **Modal System**: Full post view with carousel
- **Like/Comment System**: Interactive with instant feedback
- **Paginated Lists**: Likes and comments load incrementally

### Best Practices
- Use TanStack Query for all server state
- Pre-calculate image dimensions
- Implement query invalidation
- Add loading states everywhere
- Handle errors gracefully
- Optimize with lazy loading

---

**Document Created**: 2025-10-22  
**Version**: 1.0.0  
**Purpose**: Complete technical guide for implementing user profile and post display system



