# Home Screen Architecture

## Overview

The `home.tsx` screen is the main feed page of the Sole app. It displays a scrollable list of posts with infinite scroll, pull-to-refresh, and a collapsible header.

---

## Component Hierarchy

```
UserHome (home.tsx)
├── CollapsibleHeader
│   ├── SoleLogo (title)
│   ├── MessageCircleIcon (left)
│   └── BellIcon (right)
└── Animated.FlatList
    └── PostCard (per item)
        ├── Header (user info, avatar, timestamp)
        ├── ImageCarousel
        │   └── MediaZoom2 (pinch-to-zoom)
        ├── LikeButton
        ├── CommentModal
        │   └── CollapseDrawer → CommentSheet
        └── PostDrawer (options menu)
```

---

## Core Components

### 1. `UserHome` (home.tsx)
**Purpose:** Main feed screen container

**Key Features:**
- Uses `useInfiniteQuery` from TanStack Query for paginated post fetching
- Provides like/comment mutations
- Transforms backend data to component format
- Handles loading, error, and empty states

**Important Hooks:**
- `useScrollHeader()` - Manages collapsible header animations and zoom interactions
- `useSoleUserContext()` - Gets current user ID for API calls

**Data Flow:**
```
API (searchPosts) → useInfiniteQuery → transformPost() → PostCard
```

---

### 2. `CollapsibleHeader`
**Purpose:** Animated header that collapses on scroll

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `title` | `ReactNode` | Center content (SoleLogo) |
| `headerLeft` | `ReactNode` | Left button (messages) |
| `headerRight` | `ReactNode` | Right button (notifications) |
| `animatedStyle` | `Animated.Style` | Scroll-driven animation |
| `isDark` | `boolean` | Dark theme toggle |

**Features:**
- Glass blur effect overlay
- Safe area insets handling
- Optional second header row

---

### 3. `PostCard`
**Purpose:** Individual post display with all interactions

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `post` | `Post` | Post data object |
| `onLike` | `(postId) => void` | Like handler |
| `onAddComment` | `(postId, content) => void` | Comment handler |
| `onZoomChange` | `(isZooming) => void` | Image zoom state |
| `onScaleChange` | `(scale) => void` | Zoom scale value |

**Structure:**
1. **Header:** Avatar, username, timestamp, location, more button
2. **Body:** ImageCarousel for media
3. **Footer:** Like button, comment button, caption with hashtag/mention parsing

**Memoization:** Custom `React.memo` comparison checks only `id`, `likeCount`, `isLikedByUser`, `commentCount`

---

### 4. `ImageCarousel`
**Purpose:** Swipeable image gallery with pinch-to-zoom

**Features:**
- Single image: Direct render with zoom
- Multiple images: FlatList with pagination
- Lazy loading with ActivityIndicator
- Dynamic aspect ratio calculation
- Navigation arrows and dot indicators
- Z-index management for zoom overlay

**Key Component:** `MediaZoom2` - Handles pinch-to-zoom gestures

---

### 5. `LikeButton`
**Purpose:** Animated heart button with optimistic updates

**Features:**
- Optimistic UI update (instant feedback)
- Scale animation on press
- Filled/unfilled heart states
- Like count display

---

### 6. `CommentModal`
**Purpose:** Bottom sheet for viewing/adding comments

**Features:**
- Opens via `CollapseDrawer`
- Infinite scroll for comments (`useInfiniteQuery`)
- Text input with send button
- Comment mutation with cache invalidation

**Child Component:** `CommentSheet` - Renders comment list

---

### 7. `PostDrawer`
**Purpose:** Options menu for post actions

**Features:**
- **Creator view:** Edit, Delete buttons
- **Non-creator view:** Report button
- Delete confirmation with Alert
- Mutation-based delete with query invalidation

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    UserHome                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │ useInfiniteQuery('homePagePosts')               │    │
│  │  → searchPosts(pageNo, pageSize)                │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│                         ▼                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │ transformPost() - Maps API → Component format   │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│                         ▼                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │ FlatList → PostCard[]                           │    │
│  │  ├── onLike → likeMutation → togglePostLike    │    │
│  │  └── onAddComment → commentMutation            │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## useScrollHeader Hook

**Purpose:** Manages header collapse/expand animations synchronized with:
1. Scroll position
2. Image zoom state (collapses header when zooming)
3. Tab bar visibility

**Key Functions:**
| Function | Description |
|----------|-------------|
| `animatedHeaderStyle` | Reanimated style for header position |
| `onScroll` | Scroll event handler |
| `handleHeightChange` | Updates header height measurement |
| `handleZoomChange` | Collapses header during image zoom |
| `handleScaleChange` | Smooth header restoration on zoom reset |

---

## Performance Optimizations

1. **FlatList settings:**
   - `removeClippedSubviews={true}`
   - `maxToRenderPerBatch={5}`
   - `windowSize={5}`
   - `initialNumToRender={5}`

2. **Query caching:**
   - `staleTime: 2 * 60 * 1000` (2 minutes)
   - `refetchOnWindowFocus: false`

3. **Component memoization:**
   - `PostCard` with custom comparison
   - `UserHome` wrapped in `React.memo`

---

## API Integration

**Endpoints used:**
- `searchPosts()` - Fetch paginated posts
- `togglePostLike()` - Like/unlike post
- `createPostComment()` - Add comment
- `getPostComments()` - Fetch comments
- `deletePost()` - Delete post

**Query Keys:**
- `['homePagePosts', soleUserId]`
- `['postComments', postId]`

