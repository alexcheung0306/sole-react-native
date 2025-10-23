# 👤 Profile Page Complete Implementation Guide - ULTIMATE TECHNICAL BREAKDOWN

## 🎯 OVERVIEW
This is the **COMPLETE TECHNICAL GUIDE** for the User Profile Page - covering every aspect from URL routing to database queries to UI rendering. This page displays a user's complete profile including their info, posts, talent details, and social connections.

---

## 🏗️ COMPLETE ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER NAVIGATES TO PROFILE                   │
│              URL: /user/{username} (e.g., /user/johndoe)       │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                   NEXT.JS DYNAMIC ROUTING                       │
│  File: /src/app/(home)/user/[username]/page.tsx               │
│  Dynamic Segment: [username] → captures username from URL      │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                   PARALLEL DATA FETCHING                        │
│  1. User Profile Data (React Query)                            │
│     - Basic info, bio, avatar, categories                      │
│     - Talent info (if user is talent)                          │
│     - Follower/following counts                                │
│                                                                 │
│  2. User Posts (Infinite Query)                                │
│     - Grid of 9 posts per page                                 │
│     - Infinite scroll pagination                               │
│     - Aspect ratio pre-calculation                             │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                      UI COMPONENTS RENDER                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  UserInfo Component (Profile Header)                    │   │
│  │  - Avatar, username, name                               │   │
│  │  - Follow/Message buttons                               │   │
│  │  - Post/Follower/Following counts                       │   │
│  │  - Bio text                                             │   │
│  │  - Category chips                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ProfileTabs Component                                  │   │
│  │  [Posts] [Talent] [Jobs]                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Tab Content (Dynamic)                                  │   │
│  │  • Posts: 3x3 grid with infinite scroll                │   │
│  │  • Talent: Talent profile details                       │   │
│  │  • Jobs: Job applications/contracts                     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📂 FILE STRUCTURE & TECHNOLOGY STACK

### Main Page Component
- **Path**: `/src/app/(home)/user/[username]/page.tsx`
- **Type**: Client Component ("use client")
- **Routing**: Next.js 15 App Router Dynamic Route

### Technology Stack

#### Frontend Framework
- **Next.js 15**: App Router, Server Components, Dynamic Routes
- **React 19**: Hooks, useState, useEffect, Suspense

#### State Management
- **TanStack Query v5** (React Query): Server state, caching, pagination
- **React Context**: Global state (SoleUserContext)
- **Local State**: useState for UI state

#### Authentication
- **Clerk**: User authentication, session management
- **useUser** hook: Current logged-in user info

#### UI Library
- **HeroUI** (NextUI fork): Card, Button, Tabs, Skeleton, User component
- **Lucide React**: Icons (Grid, UserIcon, Briefcase, Edit, etc.)

#### Data Fetching
- **useQuery**: Single data fetch with caching
- **useInfiniteQuery**: Paginated data with infinite scroll
- **Custom Hooks**: useUserPostQueries, useSoleUserContext

#### Utilities
- **Framer Motion**: Animations (SlideUpTransition)
- **react-infinite-scroll-component**: Infinite scrolling

---

## 🔄 COMPLETE DATA FLOW (STEP-BY-STEP)

### Step 1: User Navigation & Route Handling

**User Action**: Clicks link or types URL
```
/user/johndoe
```

**Next.js Routing**:
- Matches pattern: `/user/[username]`
- Extracts: `username = "johndoe"`
- Loads: `/src/app/(home)/user/[username]/page.tsx`

**Component Receives Params**:
```typescript
export default function UserProfile({ params }) {
  const { username }: any = use(params) // Next.js 15 syntax
  // username = "johndoe"
}
```

---

### Step 2: Profile Data Fetching

#### A. User Profile Query (useQuery)

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
    
    // Check if viewing own profile
    if (user?.username === username) {
      setIsUser(true)
    } else {
      setIsUser(false)
    }
    
    // Check if user has talent profile
    if (result.talentLevel) {
      setIsTalent(true)
    } else {
      setIsTalent(false)
    }
    
    return result
  },
  staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  enabled: !!user && !!username && username != undefined,
  refetchOnWindowFocus: false,
})
```

**API Call**: `getUserProfileByUsername(username)`

**File**: `/src/app/api/apiservice/soleUser_api.ts`

```typescript
export const getUserProfileByUsername = async (
  username
): Promise<UserProfileData> => {
  try {
    // Validate username
    if (!username || username === "Unknown User" || username.trim() === "") {
      console.warn(`Invalid or fallback username: ${username}`)
      return {
        comcard: null,
        talentInfo: null,
        userInfo: null,
        talentLevel: null,
      }
    }

    const response = await fetch(
      `${API_BASE_URL}/sole-users/profile/username/${username}`
    )

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`User profile not found for username: ${username}`)
        return {
          comcard: null,
          talentInfo: null,
          userInfo: null,
          talentLevel: null,
        }
      }
      throw new Error(`Error: ${response.statusText}`)
    }

    const text = await response.text()
    if (!text || text.trim() === "") {
      throw new Error("Empty response from server")
    }

    const result = JSON.parse(text)
    return result
  } catch (error) {
    console.error("Error fetching data:", error)
    throw error
  }
}
```

**HTTP Request**:
```http
GET http://localhost:8080/api/sole-users/profile/username/johndoe
Accept: application/json
```

**Backend Flow** (Java Spring Boot):
```
UserController.getUserProfileByUsername(username)
    ↓
UserService.getUserProfile(username)
    ↓
Parallel Queries:
├─ SoleUserRepository.findByUsername(username)
├─ UserInfoRepository.findBySoleUserId(soleUserId)
├─ TalentInfoRepository.findBySoleUserId(soleUserId)
└─ ComCardRepository.findBySoleUserId(soleUserId)
    ↓
Combine results into UserProfileDTO
    ↓
Return JSON response
```

**Response Structure**:
```typescript
interface UserProfileData {
  comcard: ComCard | null
  talentInfo: TalentInfo | null
  userInfo: UserInfo | null
  talentLevel: string | null
}

interface UserInfo {
  id: number
  profilePic: string
  name: string
  bio: string
  category: string // CSV: "Actor,Model,Photographer"
  soleUserId: string
  bucket: string | null
  profilePicName: string | null
}

interface TalentInfo {
  id: number
  talentName: string
  gender: string
  eyeColor: string
  hairColor: string
  age: number
  height: number
  chest: number
  waist: number
  hip: number
  shoes: number
  ethnic: string
  region: string
  experience: string
  snapshotHalfBody: string
  snapshotFullBody: string
  bucket: string | null
  soleUserId: string
  comcardId: string | null
}

interface ComCard {
  id: number
  configId: number
  isActive: boolean
  soleUserId: string
  pdf: string
  png: string
  bucket: string | null
  comcardImageName: string | null
  length: number
}
```

**Example Response**:
```json
{
  "userInfo": {
    "id": 123,
    "profilePic": "https://res.cloudinary.com/xyz/image/upload/v123/profiles/johndoe.jpg",
    "name": "John Doe",
    "bio": "Professional actor and model\nBased in New York",
    "category": "Actor,Model,Photographer",
    "soleUserId": "user_abc123",
    "bucket": "profiles",
    "profilePicName": "johndoe.jpg"
  },
  "talentInfo": {
    "id": 456,
    "talentName": "John Doe",
    "gender": "Male",
    "eyeColor": "Brown",
    "hairColor": "Black",
    "age": 28,
    "height": 180,
    "chest": 100,
    "waist": 80,
    "hip": 95,
    "shoes": 42,
    "ethnic": "Asian",
    "region": "North America",
    "experience": "5 years",
    "snapshotHalfBody": "https://...",
    "snapshotFullBody": "https://...",
    "bucket": "talents",
    "soleUserId": "user_abc123",
    "comcardId": null
  },
  "comcard": null,
  "talentLevel": "verified"
}
```

---

### Step 3: Posts Data Fetching (Infinite Query)

#### B. User Posts Query (useInfiniteQuery)

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

**Custom Hook**: `/src/hooks/useUserPostQueries.ts`

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

    // Enrich posts with aspect ratios
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

**API Call**: `searchPosts({ soleUserId: "user_abc123", pageNo: 0, pageSize: 9 })`

**HTTP Request**:
```http
GET http://localhost:8080/api/post/search?soleUserId=user_abc123&content=&pageNo=0&pageSize=9&orderBy=createdAt&orderSeq=desc
```

**Backend SQL Query** (Generated by JPA/Hibernate):
```sql
SELECT 
  p.id,
  p.sole_user_id,
  p.content,
  p.created_at,
  p.updated_at
FROM post p
WHERE p.sole_user_id = 'user_abc123'
ORDER BY p.created_at DESC
LIMIT 9 OFFSET 0;

-- For each post, fetch related data:
SELECT * FROM post_media WHERE post_id = ? ORDER BY display_order ASC;
SELECT COUNT(*) FROM like WHERE post_id = ?;
SELECT COUNT(*) FROM comment WHERE post_id = ?;
SELECT * FROM user_info WHERE sole_user_id = ?;
```

**Flattening Pages**:
```typescript
const posts = userPostsData?.pages.flatMap((page) => page.data) ?? []
const totalPosts = userPostsData?.pages[0]?.total ?? 0
```

**How Flattening Works**:
```typescript
// userPostsData.pages structure:
[
  { data: [post1, post2, post3, post4, post5, post6, post7, post8, post9], total: 27, page: 0 },
  { data: [post10, post11, post12, post13, post14, post15, post16, post17, post18], total: 27, page: 1 },
  { data: [post19, post20, post21, post22, post23, post24, post25, post26, post27], total: 27, page: 2 },
]

// After flatMap:
posts = [post1, post2, post3, ..., post27]
```

---

## 🎨 UI COMPONENTS BREAKDOWN

### Component 1: UserInfo (Profile Header)

**File**: `/src/app/(home)/_components/userProfile/_userInfoComponents/userInfo.tsx`

**Layout Structure**:
```
┌─────────────────────────────────────────────────────────────┐
│  Card (Profile Header)                                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Grid Layout (6 columns)                             │  │
│  │  ┌──────────────┬──────────────┬──────────────────┐  │  │
│  │  │ Avatar       │ Stats        │ More Options     │  │  │
│  │  │ @username    │ Posts | Foll │ ⋮ Dropdown       │  │  │
│  │  │ John Doe     │ owers| wing │                  │  │  │
│  │  └──────────────┴──────────────┴──────────────────┘  │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ Follow & Message Buttons                        │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ Bio Text (with line breaks)                     │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ Category Chips: [Actor] [Model] [Photographer]  │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Key Features**:

#### A. Avatar & Username Display
```typescript
<User
  avatarProps={{
    src: userInfo?.profilePic
      ? userInfo.profilePic
      : user?.imageUrl,
  }}
  description={
    <Link isExternal href={`/user/${username}`} size="md">
      @{username}
    </Link>
  }
  name={userInfo?.name}
  className="w-full"
/>
```

#### B. Stats Display (Posts, Followers, Following)
```typescript
<div className="flex flex-col items-center">
  <Skeleton className="rounded-lg" isLoaded={!isLoading}>
    <h4 className="text-sm">{totalPosts}</h4>
  </Skeleton>
  <Skeleton className="rounded-lg" isLoaded={!isLoading}>
    <h4>Posts</h4>
  </Skeleton>
</div>

<FollowList
  username={username}
  isLoading={isLoading}
  type="follower"
/>

<FollowList
  username={username}
  isLoading={isLoading}
  type="following"
/>
```

#### C. Follow & Message Buttons (if viewing other user)
```typescript
{isUser && userInfo && filteredCategoryCHip
  ? null // Hide buttons if viewing own profile
  : userInfo && filteredCategoryCHip && (
      <div className="w-full flex gap-2">
        <FollowButton
          size="md"
          username={username}
          isUser={isUser}
        />
        <Button
          className="w-full"
          onPress={() => router.push(`/chatroom/${username}`)}
        >
          Message
        </Button>
      </div>
    )
}
```

#### D. Bio Text with Line Breaks
```typescript
const DisplayTextWithBreaks = ({ text }) => {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: text.replace(/\n/g, "<br />"), // Convert newlines to <br />
      }}
    />
  )
}

// Usage:
{userInfo?.bio && (
  <DisplayTextWithBreaks text={userInfo?.bio || ""} />
)}
```

#### E. Category Chips (CSV to Array)
```typescript
// Parse CSV categories
const categoryValue =
  typeof userInfo?.category === "string" 
    ? userInfo.category.split(",") 
    : []

const filteredCategoryCHip = categoryValue.filter((item) => item !== "")

// Render chips
{filteredCategoryCHip && filteredCategoryCHip != "" ? (
  <div>
    {filteredCategoryCHip &&
      filteredCategoryCHip.map((category, index) => (
        <Chip
          variant="bordered"
          key={index}
          className="mb-2 mr-2"
        >
          {category}
        </Chip>
      ))}
  </div>
) : null}
```

#### F. More Options Dropdown
```typescript
<Dropdown>
  <DropdownTrigger>
    <Button isIconOnly variant="light">
      <EllipsisVertical />
    </Button>
  </DropdownTrigger>

  <DropdownMenu>
    {!isUser && !isLoading && (
      <DropdownItem
        key="add-to-categories"
        onPress={onDrawerOpen}
        startContent={<Plus className="w-4 h-4" />}
      >
        Add to Starred Categories
      </DropdownItem>
    )}
    {isUser && userInfo && filteredCategoryCHip && !isLoading && (
      <DropdownItem
        key="edit-info"
        onPress={onFormOpen}
        startContent={<Edit className="w-4 h-4" />}
      >
        Edit Info
      </DropdownItem>
    )}
  </DropdownMenu>
</Dropdown>
```

**Conditional Rendering Logic**:
- **Viewing Own Profile** (`isUser = true`):
  - Hide Follow & Message buttons
  - Show "Edit Info" in dropdown
  - Enable profile editing
  
- **Viewing Other User** (`isUser = false`):
  - Show Follow & Message buttons
  - Show "Add to Starred Categories" in dropdown
  - Disable editing

---

### Component 2: ProfileTabs (Tab Navigation)

**File**: `/src/app/(home)/_components/userProfile/_components/profile-tabs.tsx`

**Layout**:
```
┌───────────────────────────────────────────────┐
│  [Grid Icon] [User Icon] [Briefcase Icon]    │
│    Posts        Talent         Jobs           │
└───────────────────────────────────────────────┘
```

**Implementation**:
```typescript
type TabKey = "posts" | "talent" | "jobs"

export default function ProfileTabs({ isLoading, profileTab, setProfileTab }) {
  const [selected, setSelected] = useState("")
  
  const handleTabChange = (key: TabKey) => {
    setSelected(key)
    setProfileTab(key) // Update parent component state
  }
  
  return (
    <Tabs
      aria-label="Options"
      color="primary"
      variant="bordered"
      fullWidth
      onSelectionChange={handleTabChange}
    >
      <Tab
        key="posts"
        title={
          <div className="flex items-center space-x-2">
            <Grid />
          </div>
        }
      />

      <Tab
        key="talent"
        title={
          <div className="flex items-center space-x-2">
            <UserIcon />
          </div>
        }
      />
      
      <Tab
        key="jobs"
        title={
          <div className="flex items-center space-x-2">
            <Briefcase />
          </div>
        }
      />
    </Tabs>
  )
}
```

**State Management**:
- Parent component (`UserProfile`) holds `profileTab` state
- Child component (`ProfileTabs`) updates parent via `setProfileTab`
- Parent conditionally renders content based on `profileTab` value

---

### Component 3: Posts Grid (Tab Content)

**Conditional Rendering**:
```typescript
{profileTab === "posts" && (
  <div className="scroll-container h-full overflow-y-auto">
    <InfiniteScroll
      dataLength={posts.length}
      next={userFetchNextPage}
      hasMore={userHasNextPage ?? false}
      scrollableTarget="scrollableDiv"
      loader={
        <div className="flex justify-center py-4">
          <Spinner size="md" label="Loading more posts..." />
        </div>
      }
    >
      <div className="grid grid-cols-3 gap-1">
        {posts.map((post, index) => (
          <UserPost
            index={index}
            key={post.id}
            isLoading={userIsLoading}
            post={post}
            type="card"
            dimensionType={post.dimensionType || "square"}
          />
        ))}
      </div>
    </InfiniteScroll>
  </div>
)}
```

**Grid Layout**:
- **CSS**: `grid grid-cols-3 gap-1`
- **Result**: 3 columns, 1px gap between items
- **Responsive**: Works on mobile, tablet, desktop
- **Items**: Square thumbnails (first image of each post)

**Infinite Scroll**:
- **Trigger**: When user scrolls to 80% of content
- **Action**: Calls `userFetchNextPage()`
- **Load**: Next 9 posts (3 more rows)
- **Append**: New posts added to existing grid
- **Repeat**: Until all posts loaded (`hasNextPage = false`)

---

### Component 4: Talent Profile (Tab Content)

```typescript
{profileTab === "talent" && (
  <TalentProfile
    isTalent={isTalent}
    data={userProfileData}
    isLoading={userProfileIsLoading}
    viewerSoleUserId={soleUserId}
    refetch={refetch}
  />
)}
```

**Displays**:
- Physical measurements (height, weight, chest, waist, hip)
- Personal details (age, gender, eye color, hair color)
- Professional info (experience, skills, category)
- Portfolio images (half-body, full-body snapshots)
- ComCard (digital portfolio card)

---

### Component 5: Jobs Tab (Placeholder)

```typescript
{profileTab === "jobs" && <>No Job Record</>}
```

**Future Implementation**:
- Job applications
- Active contracts
- Completed projects
- Earnings summary

---

## 🚀 PERFORMANCE OPTIMIZATIONS

### 1. Query Caching (React Query)

```typescript
{
  staleTime: 1000 * 60 * 5, // 5 minutes
  refetchOnWindowFocus: false,
}
```

**Effect**:
- Profile data cached for 5 minutes
- Revisiting profile = instant load
- No redundant API calls
- Better UX, less server load

### 2. Lazy Loading with Skeleton

```typescript
<Skeleton className="rounded-lg" isLoaded={!isLoading}>
  <User avatarProps={{ src: userInfo?.profilePic }} />
</Skeleton>
```

**Effect**:
- Shows placeholder while loading
- Prevents layout shift
- Better perceived performance
- Smooth transitions

### 3. Infinite Scroll Pagination

**Why Not Load All Posts?**:
- User has 100 posts → Don't load all at once
- Load 9 posts initially
- Load more as user scrolls
- Faster initial render
- Less memory usage
- Better mobile performance

### 4. Aspect Ratio Pre-calculation

```typescript
const enrichedData = await enrichPostsWithDimensions(response.data)
```

**What It Does**:
```typescript
async function enrichPostsWithDimensions(posts: PostWithDetailsResponse[]) {
  return await Promise.all(
    posts.map(async (post) => {
      if (post.media && post.media.length > 0) {
        const firstMediaUrl = post.media[0].mediaUrl
        
        // Download image, measure dimensions
        const ratio = await getAspectRatioFromUrl(firstMediaUrl)
        const dimensionType = getDimensionType(ratio)

        return {
          ...post,
          calculatedRatio: ratio, // "16/9", "1/1", "4/5"
          dimensionType, // "landscape", "square", "portrait"
        }
      }
      return post
    })
  )
}
```

**Effect**:
- No layout shifts when images load
- Smooth scrolling
- Better CLS (Cumulative Layout Shift) score
- Professional appearance

### 5. Conditional Data Fetching

```typescript
{
  enabled: !!userProfileData?.userInfo?.soleUserId,
}
```

**Effect**:
- Posts query waits for profile data
- Prevents unnecessary API calls
- Ensures soleUserId is available
- Avoids errors from missing dependencies

---

## 🔑 KEY TECHNICAL CONCEPTS

### 1. Next.js 15 Dynamic Routes

**File Structure**:
```
/src/app/(home)/user/
  └── [username]/
      └── page.tsx
```

**Captures**:
- `/user/john` → `username = "john"`
- `/user/alice_doe` → `username = "alice_doe"`
- `/user/photographer123` → `username = "photographer123"`

**Access Params**:
```typescript
// Next.js 15 syntax (use function)
const { username } = use(params)

// Next.js 14 syntax (destructure directly)
// const { username } = params
```

### 2. React Query State Management

**Two Types of Queries**:

#### useQuery (Single Fetch)
```typescript
useQuery({
  queryKey: ["userProfile", username],
  queryFn: () => getUserProfileByUsername(username),
})
```

**Use Case**: Profile info (fetched once)

#### useInfiniteQuery (Paginated Fetch)
```typescript
useInfiniteQuery({
  queryKey: ["profilePagePosts", username],
  queryFn: ({ pageParam }) => searchPosts({ pageNo: pageParam }),
  getNextPageParam: (lastPage, allPages) => {
    // Return next page number or undefined if done
  },
})
```

**Use Case**: Posts (loaded incrementally)

### 3. Conditional Rendering Patterns

```typescript
// Pattern 1: Early Return for Errors
if (userProfileError || !userProfileData) {
  return <ErrorMessage />
}

// Pattern 2: Ternary for Simple Conditions
{isUser ? <EditButton /> : <FollowButton />}

// Pattern 3: Logical AND for Optional Content
{userInfo?.bio && <Bio text={userInfo.bio} />}

// Pattern 4: Tab-based Rendering
{profileTab === "posts" && <PostsGrid />}
{profileTab === "talent" && <TalentProfile />}
{profileTab === "jobs" && <JobsList />}
```

### 4. State Lifting Pattern

```typescript
// Parent Component (UserProfile)
const [profileTab, setProfileTab] = useState("posts")

// Pass to Child
<ProfileTabs 
  profileTab={profileTab} 
  setProfileTab={setProfileTab} 
/>

// Child Updates Parent State
const handleTabChange = (key) => {
  setProfileTab(key) // Updates parent
}
```

**Why?**:
- Parent needs to know current tab
- Parent renders different content based on tab
- Single source of truth

---

## 📊 DATABASE SCHEMA (Related Tables)

### sole_user
```sql
CREATE TABLE sole_user (
  id VARCHAR PRIMARY KEY,
  username VARCHAR UNIQUE,
  email VARCHAR UNIQUE,
  clerkId VARCHAR UNIQUE,
  image VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  talent_level VARCHAR, -- "talent", "verified", etc.
  client_level VARCHAR, -- "client", "premium", etc.
);

CREATE INDEX idx_sole_user_username ON sole_user(username);
CREATE INDEX idx_sole_user_clerkId ON sole_user(clerkId);
```

### user_info
```sql
CREATE TABLE user_info (
  id SERIAL PRIMARY KEY,
  profile_pic VARCHAR,
  name VARCHAR(100) NOT NULL,
  bio TEXT,
  category VARCHAR, -- CSV: "Actor,Model,Photographer"
  sole_user_id VARCHAR,
  bucket VARCHAR,
  profile_pic_name VARCHAR,
  FOREIGN KEY (sole_user_id) REFERENCES sole_user(id)
);

CREATE INDEX idx_user_info_sole_user_id ON user_info(sole_user_id);
```

### talent_info
```sql
CREATE TABLE talent_info (
  id SERIAL PRIMARY KEY,
  talent_name VARCHAR(100) NOT NULL,
  gender VARCHAR(20),
  eye_color VARCHAR(50),
  hair_color VARCHAR(50),
  age INTEGER,
  height DECIMAL(5,2),
  chest DECIMAL(5,2),
  waist DECIMAL(5,2),
  hip DECIMAL(5,2),
  shoes INTEGER,
  ethnic VARCHAR(50),
  region VARCHAR(50),
  experience VARCHAR(100),
  snapshot_halfbody VARCHAR,
  snapshot_fullbody VARCHAR,
  bucket VARCHAR,
  sole_user_id VARCHAR,
  comcard_id VARCHAR,
  FOREIGN KEY (sole_user_id) REFERENCES sole_user(id)
);

CREATE INDEX idx_talent_info_sole_user_id ON talent_info(sole_user_id);
```

### post
```sql
CREATE TABLE post (
  id SERIAL PRIMARY KEY,
  sole_user_id VARCHAR NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (sole_user_id) REFERENCES sole_user(id) ON DELETE CASCADE
);

CREATE INDEX idx_post_sole_user_id ON post(sole_user_id);
CREATE INDEX idx_post_created_at ON post(created_at DESC);
CREATE INDEX idx_post_user_created ON post(sole_user_id, created_at DESC);
```

### follow
```sql
CREATE TABLE follow (
  id SERIAL PRIMARY KEY,
  follower_id VARCHAR NOT NULL,
  followed_id VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, followed_id),
  FOREIGN KEY (follower_id) REFERENCES sole_user(id) ON DELETE CASCADE,
  FOREIGN KEY (followed_id) REFERENCES sole_user(id) ON DELETE CASCADE
);

CREATE INDEX idx_follow_follower_id ON follow(follower_id);
CREATE INDEX idx_follow_followed_id ON follow(followed_id);
```

---

## 🛠️ IMPLEMENTATION CHECKLIST

### Step 1: Set Up Dynamic Route
```typescript
- [ ] Create /src/app/(home)/user/[username]/page.tsx
- [ ] Add "use client" directive
- [ ] Import necessary hooks and components
- [ ] Extract username from params using use(params)
```

### Step 2: Implement Profile Data Fetching
```typescript
- [ ] Create API function: getUserProfileByUsername()
- [ ] Set up useQuery for profile data
- [ ] Handle loading states
- [ ] Handle error states (404, network errors)
- [ ] Determine isUser (viewing own profile?)
- [ ] Determine isTalent (user has talent profile?)
```

### Step 3: Implement Posts Data Fetching
```typescript
- [ ] Create/use useUserPostQueries hook
- [ ] Set up useInfiniteQuery for posts
- [ ] Configure pagination (pageSize = 9)
- [ ] Implement enrichPostsWithDimensions
- [ ] Flatten pages into single array
- [ ] Calculate total posts count
```

### Step 4: Build UserInfo Component
```typescript
- [ ] Display avatar with fallback
- [ ] Show username and name
- [ ] Display post/follower/following counts
- [ ] Implement Follow & Message buttons
- [ ] Show bio with line breaks
- [ ] Parse and display category chips
- [ ] Add More Options dropdown
- [ ] Implement skeleton loading states
```

### Step 5: Build ProfileTabs Component
```typescript
- [ ] Create tab navigation (Posts, Talent, Jobs)
- [ ] Use icon-only tabs
- [ ] Handle tab change events
- [ ] Update parent component state
- [ ] Style active tab
```

### Step 6: Implement Tab Content
```typescript
- [ ] Posts: Grid with infinite scroll
- [ ] Talent: Talent profile display
- [ ] Jobs: Job applications/contracts
- [ ] Handle loading states for each tab
- [ ] Handle empty states
```

### Step 7: Add Animations
```typescript
- [ ] Wrap components in SlideUpTransition
- [ ] Set staggered delays (0, 0.1, 0.2...)
- [ ] Configure smooth transitions
```

### Step 8: Optimize Performance
```typescript
- [ ] Configure React Query caching
- [ ] Implement skeleton loaders
- [ ] Add lazy loading for images
- [ ] Pre-calculate aspect ratios
- [ ] Optimize infinite scroll threshold
```

---

## 📝 SUMMARY

### Data Flow
1. **URL** → Next.js extracts username from `/user/[username]`
2. **Profile Query** → Fetches user info, talent info, comcard
3. **Posts Query** → Fetches paginated posts (9 at a time)
4. **Enrichment** → Calculates aspect ratios for images
5. **Rendering** → UserInfo + ProfileTabs + Tab Content
6. **Infinite Scroll** → Loads more posts as user scrolls

### Key Technologies
- **Next.js 15**: Dynamic routing, App Router
- **React 19**: Hooks, useState, useEffect
- **TanStack Query v5**: useQuery, useInfiniteQuery
- **Clerk**: Authentication
- **HeroUI**: UI components
- **Framer Motion**: Animations
- **TypeScript**: Type safety

### Component Hierarchy
```
UserProfile (page.tsx)
├── UserInfo
│   ├── User (avatar)
│   ├── FollowButton
│   ├── MessageButton
│   ├── FollowList (followers)
│   ├── FollowList (following)
│   └── CategoryChips
├── ProfileTabs
│   ├── Tab (Posts)
│   ├── Tab (Talent)
│   └── Tab (Jobs)
└── Tab Content
    ├── PostsGrid (InfiniteScroll)
    │   └── UserPost (cards)
    ├── TalentProfile
    └── JobsList
```

### Best Practices
- ✅ Dynamic routing for user profiles
- ✅ Parallel data fetching (profile + posts)
- ✅ Infinite scroll pagination
- ✅ Query caching (5 minutes)
- ✅ Skeleton loading states
- ✅ Error handling (404, network errors)
- ✅ Conditional rendering (own vs other user)
- ✅ Aspect ratio pre-calculation
- ✅ Responsive design
- ✅ Smooth animations

---

**Copy this entire guide and paste it to another Cursor. They'll understand EVERYTHING about your Profile Page implementation - from URL routing to database queries to UI rendering.**

**Document Created**: 2025-10-22  
**Version**: 1.0.0 (ULTIMATE EDITION)  
**Purpose**: Complete technical guide for user profile page implementation with every detail explained



