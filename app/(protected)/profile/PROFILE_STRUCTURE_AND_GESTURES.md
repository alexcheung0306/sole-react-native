# Profile Screen Structure and Gesture Handling

## Overview

The Profile Screen (`app/(protected)/profile/[username]/index.tsx`) is a complex React Native component that displays user profiles with Instagram-like post grid interactions, modal transitions, and sophisticated gesture handling.

## Component Structure

### Main Component: `ProfileScreen`

**Location:** `app/(protected)/profile/[username]/index.tsx`

**Entry Points:**
- Direct route: `/profile/[username]`
- Wrapped in `UserProfileWrapper` at `app/(protected)/(user)/UserProfileWrapper.tsx` for the current user's profile
- Referenced in `JobListCard.tsx` for navigation

### Component Hierarchy

```
ProfileScreen (index.tsx)
├── CollapsibleHeader
│   └── GlassOverlay (glass effect)
├── ScrollView (main scroll container)
│   ├── UserInfo
│   │   ├── FollowList (follower/following counts)
│   │   └── UserInfoFormPortal (for own profile)
│   ├── ProfileTabNav
│   └── Tab Content (conditional)
│       ├── UserPosts (posts tab - grid view)
│       ├── TalentProfile (talent tab)
│       └── JobHistory (jobs tab)
└── PostFeedModal (overlay modal)
    ├── GestureDetector (pan gesture handler)
    ├── Animated.View (modal container)
    │   ├── Header (back button)
    │   └── Animated.ScrollView
    │       └── PostCard[] (list of posts)
    │           └── ImageCarousel (with zoom gestures)
```

## Key Components

### 1. **CollapsibleHeader**
- **Purpose:** Collapsible header that hides/shows on scroll
- **Features:**
  - Glass overlay effect
  - Animated collapse/expand based on scroll position
  - Back button (when viewing other profiles)
  - Settings button (own profile)
  - Notifications button (own profile)
- **Animation:** Controlled by `useScrollHeader` hook

### 2. **UserInfo**
- **Purpose:** Displays user profile information
- **Shows:**
  - Profile picture
  - Post count
  - Follower/Following counts (via `FollowList`)
  - Bio and category chips
  - Edit button (own profile) or Follow/Message buttons (other profiles)

### 3. **ProfileTabNav**
- **Purpose:** Tab navigation between Posts, Talent, and Jobs
- **Tabs:**
  - `posts`: Grid view of user posts
  - `talent`: Talent profile information
  - `jobs`: Job history

### 4. **UserPosts**
- **Purpose:** Displays posts in a 3-column grid (Instagram-style)
- **Features:**
  - Grid layout (3 columns, square images)
  - Tap to open modal
  - Passes layout information (x, y, width, height, col, row) to parent
  - Infinite scroll support

### 5. **PostFeedModal**
- **Purpose:** Full-screen modal for viewing posts in a scrollable list
- **Key Features:**
  - Instagram-like expand animation from grid thumbnail
  - Pan gesture to dismiss
  - Scrollable list of posts
  - Tracks currently visible post index
  - Handles zoom state (disables scroll when zooming)

### 6. **PostCard**
- **Purpose:** Individual post display
- **Features:**
  - User header with avatar
  - Image/Video carousel
  - Like and comment buttons
  - Caption with hashtag/mention parsing
  - Zoom support via `ImageCarousel`

## Gesture System

### 1. Scroll Gestures

#### Profile Scroll
- **Component:** Main `ScrollView` in `ProfileScreen`
- **Behavior:**
  - Tracks scroll position in `profileScrollY.current`
  - Updates header collapse state via `onScroll` callback
  - Uses `useScrollHeader` hook for header animation
  - Pull-to-refresh support

#### Modal Scroll
- **Component:** `Animated.ScrollView` in `PostFeedModal`
- **Behavior:**
  - Scrolls through posts vertically
  - Tracks which post is currently visible
  - Updates `currentVisibleIndex.current` based on scroll position
  - Disabled when a post is zoomed (`scrollEnabled={zoomingIndex === null}`)
  - Initial scroll offset set via `contentOffset` prop to match grid position

### 2. Pan Gesture (Modal Dismiss)

**Location:** `PostFeedModal.tsx` (lines 111-146)

**Gesture Configuration:**
```typescript
const panGesture = Gesture.Pan()
  .activeOffsetX(15)  // Minimum 15px horizontal movement to activate
  .onUpdate((event) => {
    // Follow finger on both X and Y axes
    translateX.value = event.translationX;
    translateY.value = event.translationY;
    
    // Scale down based on distance from center
    const distance = Math.sqrt(event.translationX ** 2 + event.translationY ** 2);
    const swipeProgress = interpolate(distance, [0, SCREEN_WIDTH * 0.5], [1, 0.85]);
    expandProgress.value = swipeProgress;
  })
  .onEnd((event) => {
    // Check if should close
    const isFlingRight = event.velocityX > FLING_VELOCITY_THRESHOLD; // 300
    const isFlingDown = event.velocityY > FLING_VELOCITY_THRESHOLD;
    const isPastThreshold = event.translationX > SWIPE_THRESHOLD; // 30% of screen width
    
    if (isFlingRight || isFlingDown || isPastThreshold) {
      // Close modal - animate back to source thumbnail
      handleGestureClose();
    } else {
      // Snap back to full screen
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      expandProgress.value = withTiming(1);
    }
  });
```

**Close Conditions:**
- Fling right with velocity > 300
- Fling down with velocity > 300
- Swipe right past 30% of screen width

**Animation Behavior:**
- During drag: Modal follows finger, scales down based on distance
- On release: Either snaps back or closes with collapse animation

### 3. Zoom Gestures (Image Carousel)

**Location:** `PostCard` → `ImageCarousel` (not shown in provided files, but referenced)

**Integration:**
- `PostCard` receives `onZoomChange` and `onScaleChange` callbacks
- When zooming, `zoomingIndex` state is set in `PostFeedModal`
- Modal scroll is disabled when `zoomingIndex !== null`
- Header and tab bar collapse during zoom (via `useScrollHeader` hook)

**Header Behavior During Zoom:**
- When zoom starts: Header collapses immediately
- During zoom: Header stays collapsed
- When zoom ends: Header restores to original position
- Scale-based interpolation during zoom reset

### 4. Tap Gestures

#### Grid Post Tap
- **Location:** `UserPosts.tsx` (lines 74-86)
- **Action:** Opens `PostFeedModal` with expand animation
- **Data Passed:**
  - Post index
  - Layout information (x, y, width, height, col, row)

#### Modal Back Button Tap
- **Location:** `PostFeedModal.tsx` (line 181)
- **Action:** Closes modal with collapse animation back to thumbnail

## Animation System

### 1. Modal Expand/Collapse Animation

**Shared Values:**
- `expandProgress`: 0 to 1, controls expansion
- `sourceX`, `sourceY`: Starting position (grid thumbnail center)
- `translateX`, `translateY`: Pan gesture offsets
- `modalOpacity`: Backdrop opacity

**Expand Animation:**
```typescript
// Scale from 0.333 (thumbnail size) to 1 (full screen)
const scale = interpolate(expandProgress, [0, 1], [0.333, 1]);

// Position from source (grid) to center (0, 0)
const animatedX = interpolate(expandProgress, [0, 1], [sourceX, 0]);
const animatedY = interpolate(expandProgress, [0, 1], [sourceY, 0]);

// Border radius from 20 to 40
const borderRadius = interpolate(expandProgress, [0, 1], [20, 40]);
```

**Collapse Animation:**
- Reverses the expand animation
- Calculates target position based on `currentVisibleIndex` (last viewed post)
- Uses `getGridPositionForIndex` to find thumbnail position
- Duration: 300ms for expand/collapse, 200ms for opacity

### 2. Header Collapse Animation

**Hook:** `useScrollHeader` → `useCollapsibleBar`

**Behavior:**
- Collapses on scroll down
- Expands on scroll up
- Smooth interpolation based on scroll position
- Handles zoom state separately (collapses during zoom)

### 3. Position Tracking

**Grid Position Calculation:**
```typescript
const getGridPositionForIndex = (index: number) => {
  const col = index % 3;
  const row = Math.floor(index / 3);
  const x = col * IMAGE_SIZE + IMAGE_SIZE / 2;
  const y = GRID_START_OFFSET + row * IMAGE_SIZE - profileScrollY.current + IMAGE_SIZE / 2;
  return {
    x: x - SCREEN_WIDTH / 2,  // Relative to screen center
    y: y - SCREEN_HEIGHT / 2,
  };
};
```

**Scroll Offset Calculation:**
```typescript
const getOffsetForIndex = (index: number) => {
  let offset = 10; // paddingTop
  for (let i = 0; i < index; i++) {
    const postId = transformedPosts[i]?.id;
    const height = itemHeights.current[postId] || 600; // fallback
    offset += height;
  }
  return offset;
};
```

## State Management

### Key State Variables

1. **`profileTab`**: Current tab ('posts' | 'talent' | 'jobs')
2. **`postModalVisible`**: Modal visibility
3. **`selectedPostIndex`**: Initially selected post index
4. **`modalScrollOffset`**: Scroll position for modal
5. **`modalKey`**: Forces ScrollView remount
6. **`zoomingIndex`**: Currently zooming post index (null when not zooming)

### Refs

1. **`postListRef`**: Reference to modal ScrollView
2. **`itemHeights`**: Map of post IDs to their heights
3. **`profileScrollY`**: Current profile scroll position
4. **`currentVisibleIndex`**: Currently visible post in modal

### Shared Values (Reanimated)

1. **`expandProgress`**: Modal expansion progress (0-1)
2. **`translateX`, `translateY`**: Pan gesture offsets
3. **`sourceX`, `sourceY`**: Source position for expand animation
4. **`modalOpacity`**: Backdrop opacity

## Data Flow

### Opening Modal

1. User taps post in grid (`UserPosts`)
2. `onPostPress(index, layout)` called
3. `openPostModal` calculates:
   - Source position from layout
   - Scroll offset for target post
4. Sets `postModalVisible = true`
5. Starts expand animation (300ms)
6. Modal ScrollView scrolls to calculated offset

### Closing Modal

1. User either:
   - Taps back button → `closePostModal()`
   - Swipes/flings → `handleGestureClose()`
2. Calculates target position from `currentVisibleIndex`
3. Animates collapse (300ms)
4. Sets `postModalVisible = false` after animation
5. Cleans up scroll state

### Scrolling in Modal

1. User scrolls modal ScrollView
2. `handleModalScroll` calculates visible post
3. Updates `currentVisibleIndex.current`
4. Used for close animation target position

## Key Features

### 1. Instagram-like Expand Animation
- Modal expands from grid thumbnail position
- Smooth scale and position interpolation
- Border radius animation

### 2. Pan-to-Dismiss
- Follow finger on both axes
- Scale down during drag
- Velocity-based dismissal
- Threshold-based dismissal

### 3. Scroll Position Synchronization
- Modal opens at correct scroll position
- Tracks item heights for accurate positioning
- Handles dynamic content heights

### 4. Zoom Integration
- Disables scroll when zooming
- Tracks zooming post index
- Header collapses during zoom

### 5. Performance Optimizations
- Memoized post transformations
- Ref-based position tracking
- Conditional rendering
- Shared values for animations (UI thread)

## Dependencies

- **React Native Reanimated**: All animations
- **React Native Gesture Handler**: Pan gestures
- **Expo Router**: Navigation
- **Clerk**: User authentication
- **React Query**: Data fetching (via `useProfileQueries`)

## Usage Examples

### Navigation to Profile
```typescript
router.push(`/profile/${username}`);
```

### Opening Post Modal (from grid)
```typescript
onPostPress(index, {
  x: col * IMAGE_SIZE,
  y: row * IMAGE_SIZE,
  width: IMAGE_SIZE,
  height: IMAGE_SIZE,
  col,
  row,
});
```

## Notes

- The modal is always mounted but hidden with `pointerEvents` and `zIndex`
- Scroll position is calculated based on measured item heights
- Grid position accounts for profile scroll offset
- Close animation uses last viewed post, not initially selected post
- Pan gesture allows free movement on both axes (not just horizontal)

