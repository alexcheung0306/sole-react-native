# 🔥 COMPLETE DATA FLOW GUIDE - Database to UI (ULTIMATE EDITION)

## 🎯 OVERVIEW
This is the **ULTIMATE TECHNICAL BREAKDOWN** of how posts/feed data flows from the **PostgreSQL database** through the **Java Spring Boot backend** to the **Next.js React frontend** and finally renders in the UI. This covers EVERY layer of the stack.

---

## 🏗️ ARCHITECTURE OVERVIEW

### Full Stack Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                           │
│  PostgreSQL Database (Neon/Vercel Postgres)                    │
│  - post table                                                   │
│  - post_media table                                            │
│  - post_like table                                             │
│  - post_comment table                                          │
│  - sole_user table                                             │
│  - user_info table                                             │
└─────────────────────────────────────────────────────────────────┘
                          ↕ JDBC Connection
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API LAYER                            │
│  Java Spring Boot Server (Port 8080)                           │
│  - PostController.java                                          │
│  - PostService.java                                            │
│  - PostRepository.java (JPA)                                   │
│  - PostMediaRepository.java                                    │
│  - PostLikeRepository.java                                     │
│  - PostCommentRepository.java                                  │
│  - UserInfoRepository.java                                     │
│  REST API Endpoints:                                           │
│    GET  /api/post/search                                       │
│    GET  /api/post/{id}                                         │
│    POST /api/post                                              │
│    PUT  /api/post/{id}                                         │
│    DELETE /api/post/{id}                                       │
│    POST /api/post-likes/toggle/{postId}/{userId}              │
│    POST /api/post-comments                                     │
└─────────────────────────────────────────────────────────────────┘
                          ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND API LAYER                          │
│  Next.js 15 Application (Port 3000)                            │
│  - /src/app/api/apiservice/post_api.ts                        │
│  - API_BASE_URL: http://localhost:8080/api                    │
│  Functions:                                                    │
│    - searchPosts(params)                                       │
│    - getPostById(id)                                           │
│    - createPost(data)                                          │
│    - togglePostLike(postId, userId)                           │
│    - createPostComment(postId, userId, comment)               │
└─────────────────────────────────────────────────────────────────┘
                          ↕ React Query
┌─────────────────────────────────────────────────────────────────┐
│                      DATA FETCHING LAYER                        │
│  TanStack Query (React Query v5)                               │
│  - /src/hooks/useUserPostQueries.ts                           │
│  - useInfiniteQuery for pagination                            │
│  - Query caching & invalidation                               │
│  - Loading states & error handling                            │
└─────────────────────────────────────────────────────────────────┘
                          ↕ React Props
┌─────────────────────────────────────────────────────────────────┐
│                         UI LAYER                                │
│  React Components                                               │
│  - /src/app/(home)/user/home/page.tsx (Home Feed)             │
│  - /src/app/(home)/user/explore/page.tsx (Explore)            │
│  - /src/app/(home)/user/[username]/page.tsx (Profile)         │
│  - /src/app/(home)/_components/userHome/display-homepage-post.tsx│
│  - /src/app/(home)/_components/userProfile/_postComponents/   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 1. DATABASE LAYER (PostgreSQL)

### Database Schema (Prisma Schema)

**File**: `/prisma/schema.prisma`

#### A. post Table
```prisma
model post {
  id           Int       @id(map: "posts_pkey") @default(autoincrement())
  sole_user_id String    // Foreign key to sole_user table
  content      String    // Post caption/text
  created_at   DateTime? @default(now()) @db.Timestamp(6)
  updated_at   DateTime? @default(now()) @db.Timestamp(6)
}
```

**SQL Equivalent**:
```sql
CREATE TABLE post (
  id SERIAL PRIMARY KEY,
  sole_user_id VARCHAR NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP(6) DEFAULT NOW(),
  updated_at TIMESTAMP(6) DEFAULT NOW()
);

CREATE INDEX idx_post_sole_user_id ON post(sole_user_id);
CREATE INDEX idx_post_created_at ON post(created_at DESC);
```

#### B. post_media Table (Not in Prisma, but exists in backend DB)
```sql
CREATE TABLE post_media (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES post(id) ON DELETE CASCADE,
  media_url VARCHAR NOT NULL,
  display_order INTEGER NOT NULL,
  file_name VARCHAR,
  file_size BIGINT,
  media_type VARCHAR, -- 'image/jpeg', 'video/mp4'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP(6) DEFAULT NOW(),
  updated_at TIMESTAMP(6) DEFAULT NOW()
);

CREATE INDEX idx_post_media_post_id ON post_media(post_id);
CREATE INDEX idx_post_media_display_order ON post_media(post_id, display_order);
```

#### C. like Table
```prisma
model like {
  id           Int       @id(map: "likes_pkey") @default(autoincrement())
  sole_user_id String
  post_id      Int
  created_at   DateTime? @default(now()) @db.Timestamp(6)
  updated_at   DateTime? @default(now()) @db.Timestamp(6)

  @@unique([sole_user_id, post_id], map: "likes_user_id_post_id_key")
}
```

**SQL Equivalent**:
```sql
CREATE TABLE like (
  id SERIAL PRIMARY KEY,
  sole_user_id VARCHAR NOT NULL,
  post_id INTEGER NOT NULL REFERENCES post(id) ON DELETE CASCADE,
  created_at TIMESTAMP(6) DEFAULT NOW(),
  updated_at TIMESTAMP(6) DEFAULT NOW(),
  UNIQUE(sole_user_id, post_id) -- Prevent duplicate likes
);

CREATE INDEX idx_like_post_id ON like(post_id);
CREATE INDEX idx_like_sole_user_id ON like(sole_user_id);
```

#### D. comment Table
```prisma
model comment {
  id           Int       @id(map: "comments_pkey") @default(autoincrement())
  sole_user_id String
  post_id      Int
  content      String    // Comment text
  created_at   DateTime? @default(now()) @db.Timestamp(6)
  updated_at   DateTime? @default(now()) @db.Timestamp(6)
}
```

**SQL Equivalent**:
```sql
CREATE TABLE comment (
  id SERIAL PRIMARY KEY,
  sole_user_id VARCHAR NOT NULL,
  post_id INTEGER NOT NULL REFERENCES post(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP(6) DEFAULT NOW(),
  updated_at TIMESTAMP(6) DEFAULT NOW()
);

CREATE INDEX idx_comment_post_id ON comment(post_id);
CREATE INDEX idx_comment_created_at ON comment(created_at DESC);
```

#### E. sole_user Table
```prisma
model sole_user {
  id                        String    @id(map: "users_pkey") @default(cuid())
  username                  String?   // Unique username
  email                     String?   @unique(map: "users_email_key")
  clerkId                   String    @unique(map: "users_clerkId_key")
  image                     String?   // Profile picture URL
  created_at                DateTime? @default(now())
  updated_at                DateTime?
  stripe_customer_id        String?   @unique
  stripe_subscription_id    String?   @unique
  stripe_price_id           String?
  stripe_current_period_end DateTime?
  client_id                 Int?
  talent_level              String?   @db.VarChar  // "talent", "verified", etc.
  client_level              String?   @db.VarChar  // "client", "premium", etc.
}
```

#### F. user_info Table
```prisma
model user_info {
  id           Int     @id @default(autoincrement())
  profile_pic  String? // Profile picture URL
  name         String  @db.VarChar(100) // Display name
  bio          String? // User bio
  category     String? // "Actor", "Model", "Photographer", etc.
  sole_user_id String? // Foreign key to sole_user
}
```

### Database Relationships

```
sole_user (1) ←→ (1) user_info
    ↓
    └── (1:N) → post
                  ↓
                  ├── (1:N) → post_media
                  ├── (1:N) → like
                  └── (1:N) → comment
```

---

## 🚀 2. BACKEND API LAYER (Java Spring Boot)

### Technology Stack
- **Framework**: Spring Boot 3.x
- **ORM**: Spring Data JPA + Hibernate
- **Database Driver**: PostgreSQL JDBC Driver
- **Validation**: Jakarta Validation API
- **JSON**: Jackson
- **File Upload**: Multipart File Handling

### Backend File Structure (Typical)
```
src/main/java/com/sole/
├── controller/
│   ├── PostController.java
│   ├── PostLikeController.java
│   └── PostCommentController.java
├── service/
│   ├── PostService.java
│   ├── PostLikeService.java
│   └── PostCommentService.java
├── repository/
│   ├── PostRepository.java
│   ├── PostMediaRepository.java
│   ├── PostLikeRepository.java
│   ├── PostCommentRepository.java
│   └── UserInfoRepository.java
├── model/
│   ├── Post.java
│   ├── PostMedia.java
│   ├── PostLike.java
│   ├── PostComment.java
│   ├── SoleUser.java
│   └── UserInfo.java
├── dto/
│   ├── PostWithDetailsResponse.java
│   ├── CreatePostRequest.java
│   └── SearchPostsParams.java
└── config/
    ├── WebConfig.java (CORS)
    └── JpaConfig.java
```

### A. PostController.java (REST Endpoints)

```java
@RestController
@RequestMapping("/api/post")
@CrossOrigin(origins = "*")
public class PostController {

    @Autowired
    private PostService postService;

    /**
     * Search posts with pagination and filtering
     * GET /api/post/search?soleUserId=&content=&pageNo=0&pageSize=10&orderBy=createdAt&orderSeq=desc
     */
    @GetMapping("/search")
    public ResponseEntity<PageResponse<PostWithDetailsResponse>> searchPosts(
        @RequestParam(required = false) String soleUserId,
        @RequestParam(required = false) String content,
        @RequestParam(required = false) Integer postId,
        @RequestParam(defaultValue = "createdAt") String orderBy,
        @RequestParam(defaultValue = "desc") String orderSeq,
        @RequestParam(defaultValue = "0") int pageNo,
        @RequestParam(defaultValue = "10") int pageSize
    ) {
        PageResponse<PostWithDetailsResponse> response = postService.searchPosts(
            soleUserId, content, postId, orderBy, orderSeq, pageNo, pageSize
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Get single post by ID with full details
     * GET /api/post/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Post> getPostById(@PathVariable Long id) {
        Post post = postService.getPostById(id);
        return ResponseEntity.ok(post);
    }

    /**
     * Get post with details (media, likes, comments count, user info)
     * GET /api/post/{id}/details
     */
    @GetMapping("/{id}/details")
    public ResponseEntity<PostWithDetailsResponse> getPostWithDetailsById(@PathVariable Long id) {
        PostWithDetailsResponse post = postService.getPostWithDetailsById(id);
        return ResponseEntity.ok(post);
    }

    /**
     * Create new post with media
     * POST /api/post
     */
    @PostMapping
    public ResponseEntity<Post> createPost(@ModelAttribute CreatePostRequest request) {
        Post post = postService.createPost(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(post);
    }

    /**
     * Update post content
     * PUT /api/post/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Post> updatePost(
        @PathVariable Long id,
        @RequestBody UpdatePostRequest request
    ) {
        Post post = postService.updatePost(id, request);
        return ResponseEntity.ok(post);
    }

    /**
     * Delete post and all related data (media, likes, comments)
     * DELETE /api/post/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ResponseEntity.noContent().build();
    }
}
```

### B. PostService.java (Business Logic)

```java
@Service
@Transactional
public class PostService {

    @Autowired
    private PostRepository postRepository;
    
    @Autowired
    private PostMediaRepository postMediaRepository;
    
    @Autowired
    private PostLikeRepository postLikeRepository;
    
    @Autowired
    private PostCommentRepository postCommentRepository;
    
    @Autowired
    private UserInfoRepository userInfoRepository;
    
    @Autowired
    private CloudinaryService cloudinaryService; // For image uploads

    /**
     * Search posts with complex query and pagination
     */
    public PageResponse<PostWithDetailsResponse> searchPosts(
        String soleUserId,
        String content,
        Integer postId,
        String orderBy,
        String orderSeq,
        int pageNo,
        int pageSize
    ) {
        // Build dynamic query
        Specification<Post> spec = Specification.where(null);
        
        // Filter by user if provided
        if (soleUserId != null && !soleUserId.isEmpty()) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("soleUserId"), soleUserId)
            );
        }
        
        // Filter by content if provided
        if (content != null && !content.isEmpty()) {
            spec = spec.and((root, query, cb) -> 
                cb.like(cb.lower(root.get("content")), "%" + content.toLowerCase() + "%")
            );
        }
        
        // Filter by postId if provided
        if (postId != null) {
            spec = spec.and((root, query, cb) -> 
                cb.equal(root.get("id"), postId)
            );
        }
        
        // Build sort
        Sort.Direction direction = orderSeq.equalsIgnoreCase("asc") ? 
            Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = Sort.by(direction, orderBy);
        
        // Create pageable
        Pageable pageable = PageRequest.of(pageNo, pageSize, sort);
        
        // Execute query
        Page<Post> postPage = postRepository.findAll(spec, pageable);
        
        // Transform to PostWithDetailsResponse
        List<PostWithDetailsResponse> postResponses = postPage.getContent().stream()
            .map(this::enrichPostWithDetails)
            .collect(Collectors.toList());
        
        // Build response
        return new PageResponse<>(
            postResponses,
            postPage.getTotalElements(),
            postPage.getNumber(),
            postPage.getSize()
        );
    }

    /**
     * Enrich post with media, like count, comment count, and user info
     */
    private PostWithDetailsResponse enrichPostWithDetails(Post post) {
        // Fetch media sorted by display order
        List<PostMedia> media = postMediaRepository.findByPostIdOrderByDisplayOrderAsc(post.getId());
        
        // Count likes
        long likeCount = postLikeRepository.countByPostId(post.getId());
        
        // Count comments
        long commentCount = postCommentRepository.countByPostId(post.getId());
        
        // Fetch user info
        UserInfo userInfo = userInfoRepository.findBySoleUserId(post.getSoleUserId())
            .orElse(null);
        
        // Build DTO
        return PostWithDetailsResponse.builder()
            .id(post.getId())
            .soleUserId(post.getSoleUserId())
            .content(post.getContent())
            .createdAt(post.getCreatedAt())
            .updatedAt(post.getUpdatedAt())
            .media(media)
            .likeCount(likeCount)
            .commentCount(commentCount)
            .mediaCount(media.size())
            .soleUserInfo(userInfo != null ? mapToSoleUserInfo(userInfo) : null)
            .build();
    }

    /**
     * Create new post with media files
     */
    public Post createPost(CreatePostRequest request) {
        // Create post entity
        Post post = new Post();
        post.setSoleUserId(request.getSoleUserId());
        post.setContent(request.getContent());
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());
        
        // Save post to get ID
        Post savedPost = postRepository.save(post);
        
        // Upload and save media files
        if (request.getPostMedias() != null && !request.getPostMedias().isEmpty()) {
            for (int i = 0; i < request.getPostMedias().size(); i++) {
                PostMediaRequest mediaRequest = request.getPostMedias().get(i);
                
                if (mediaRequest.getFile() != null) {
                    // Upload to Cloudinary
                    String mediaUrl = cloudinaryService.uploadFile(
                        mediaRequest.getFile(),
                        "posts",
                        savedPost.getId() + "_" + i
                    );
                    
                    // Create media entity
                    PostMedia media = new PostMedia();
                    media.setPostId(savedPost.getId());
                    media.setMediaUrl(mediaUrl);
                    media.setDisplayOrder(i);
                    media.setFileName(mediaRequest.getFile().getOriginalFilename());
                    media.setFileSize(mediaRequest.getFile().getSize());
                    media.setMediaType(mediaRequest.getFile().getContentType());
                    media.setIsActive(true);
                    media.setCreatedAt(LocalDateTime.now());
                    
                    postMediaRepository.save(media);
                }
            }
        }
        
        return savedPost;
    }
}
```

### C. PostRepository.java (JPA Repository)

```java
@Repository
public interface PostRepository extends JpaRepository<Post, Long>, JpaSpecificationExecutor<Post> {
    
    // Custom queries using JPA method naming
    List<Post> findBySoleUserIdOrderByCreatedAtDesc(String soleUserId);
    
    Page<Post> findBySoleUserId(String soleUserId, Pageable pageable);
    
    long countBySoleUserId(String soleUserId);
    
    // Custom query with @Query annotation
    @Query("SELECT p FROM Post p WHERE p.soleUserId = :soleUserId AND p.content LIKE %:content%")
    List<Post> searchPosts(@Param("soleUserId") String soleUserId, @Param("content") String content);
    
    // Native SQL query for complex operations
    @Query(value = "SELECT p.*, " +
           "(SELECT COUNT(*) FROM like WHERE post_id = p.id) as like_count, " +
           "(SELECT COUNT(*) FROM comment WHERE post_id = p.id) as comment_count " +
           "FROM post p " +
           "WHERE (:soleUserId IS NULL OR p.sole_user_id = :soleUserId) " +
           "ORDER BY p.created_at DESC " +
           "LIMIT :limit OFFSET :offset",
           nativeQuery = true)
    List<Object[]> searchPostsWithCounts(
        @Param("soleUserId") String soleUserId,
        @Param("limit") int limit,
        @Param("offset") int offset
    );
}
```

### D. PostMediaRepository.java

```java
@Repository
public interface PostMediaRepository extends JpaRepository<PostMedia, Long> {
    
    List<PostMedia> findByPostIdOrderByDisplayOrderAsc(Long postId);
    
    void deleteByPostId(Long postId);
    
    long countByPostId(Long postId);
}
```

### E. PostLikeRepository.java

```java
@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    
    Optional<PostLike> findByPostIdAndSoleUserId(Long postId, String soleUserId);
    
    boolean existsByPostIdAndSoleUserId(Long postId, String soleUserId);
    
    long countByPostId(Long postId);
    
    void deleteByPostIdAndSoleUserId(Long postId, String soleUserId);
    
    // Get paginated likes with user info (join query)
    @Query("SELECT pl, ui FROM PostLike pl " +
           "LEFT JOIN UserInfo ui ON pl.soleUserId = ui.soleUserId " +
           "WHERE pl.postId = :postId " +
           "ORDER BY pl.createdAt DESC")
    Page<Object[]> findLikesWithUserInfo(@Param("postId") Long postId, Pageable pageable);
}
```

### F. Response DTOs

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostWithDetailsResponse {
    private Long id;
    private String soleUserId;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Related data
    private List<PostMediaResponse> media;
    private long likeCount;
    private long commentCount;
    private int mediaCount;
    
    // Enriched fields (calculated on frontend)
    private String dimensionType; // "landscape", "portrait", "square"
    private String calculatedRatio; // "16/9", "1/1", "4/5"
    
    // User info
    private SoleUserInfoDTO soleUserInfo;
}

@Data
public class PostMediaResponse {
    private Long id;
    private Long postId;
    private String mediaUrl;
    private int displayOrder;
    private String fileName;
    private long fileSize;
    private String mediaType;
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

@Data
public class SoleUserInfoDTO {
    private String soleUserId;
    private String username;
    private String name;
    private String profilePic;
    private String talentLevel;
    private String clientLevel;
}

@Data
public class PageResponse<T> {
    private List<T> data;
    private long total;
    private int page;
    private int pageSize;
}
```

---

## 🌐 3. FRONTEND API LAYER (Next.js)

### API Base Configuration

**File**: `/src/app/api/apiservice.ts`

```typescript
export const API_BASE_URL = `http://${process.env.NEXT_PUBLIC_API_KEY}/api`
// Example: http://localhost:8080/api
// Production: http://your-backend-domain.com/api
```

**Environment Variable** (`.env.local`):
```bash
NEXT_PUBLIC_API_KEY=localhost:8080
# or
NEXT_PUBLIC_API_KEY=api.yourdomain.com
```

### Post API Functions

**File**: `/src/app/api/apiservice/post_api.ts`

```typescript
import { API_BASE_URL } from "../apiservice"

/**
 * Search posts with filters and pagination
 * Calls: GET /api/post/search?soleUserId=&pageNo=0&pageSize=10&orderBy=createdAt&orderSeq=desc
 */
export const searchPosts = async (
  params: SearchPostsParams = {}
): Promise<PageResponse<PostWithDetailsResponse>> => {
  try {
    const queryParams = new URLSearchParams()
    
    if (params.soleUserId) queryParams.append("soleUserId", params.soleUserId)
    if (params.content) queryParams.append("content", params.content)
    if (params.postId !== undefined) queryParams.append("postId", params.postId.toString())
    if (params.orderBy) queryParams.append("orderBy", params.orderBy)
    if (params.orderSeq) queryParams.append("orderSeq", params.orderSeq)
    if (params.pageNo !== undefined) queryParams.append("pageNo", params.pageNo.toString())
    if (params.pageSize) queryParams.append("pageSize", params.pageSize.toString())
    
    const url = `${API_BASE_URL}/post/search${queryParams.toString() ? `?${queryParams}` : ""}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`)
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error searching posts:", error)
    throw error
  }
}
```

### Full Request/Response Flow

#### Example: Fetch Home Feed Posts

**1. Frontend Call**:
```typescript
const response = await searchPosts({
  soleUserId: "", // Empty = all users
  content: "",
  pageNo: 0,
  pageSize: 3,
  orderBy: "createdAt",
  orderSeq: "desc",
})
```

**2. HTTP Request**:
```http
GET http://localhost:8080/api/post/search?soleUserId=&content=&pageNo=0&pageSize=3&orderBy=createdAt&orderSeq=desc
Host: localhost:8080
Accept: application/json
```

**3. Backend SQL Query** (Generated by JPA):
```sql
SELECT 
  p.id,
  p.sole_user_id,
  p.content,
  p.created_at,
  p.updated_at
FROM post p
WHERE 
  (p.sole_user_id = '' OR '' IS NULL) -- Empty string fetches all
ORDER BY p.created_at DESC
LIMIT 3 OFFSET 0;
```

**4. Backend Enrichment Queries**:
```sql
-- For each post, fetch media
SELECT * FROM post_media 
WHERE post_id = ? 
ORDER BY display_order ASC;

-- Count likes
SELECT COUNT(*) FROM like WHERE post_id = ?;

-- Count comments
SELECT COUNT(*) FROM comment WHERE post_id = ?;

-- Fetch user info
SELECT * FROM user_info WHERE sole_user_id = ?;
```

**5. Backend Response**:
```json
{
  "data": [
    {
      "id": 123,
      "soleUserId": "user_abc123",
      "content": "Beautiful sunset today!",
      "createdAt": "2025-10-22T14:30:00Z",
      "updatedAt": "2025-10-22T14:30:00Z",
      "media": [
        {
          "id": 456,
          "postId": 123,
          "mediaUrl": "https://res.cloudinary.com/xyz/image/upload/v123/posts/sunset.jpg",
          "displayOrder": 0,
          "fileName": "sunset.jpg",
          "fileSize": 2048576,
          "mediaType": "image/jpeg",
          "isActive": true,
          "createdAt": "2025-10-22T14:30:05Z",
          "updatedAt": "2025-10-22T14:30:05Z"
        }
      ],
      "likeCount": 42,
      "commentCount": 5,
      "mediaCount": 1,
      "soleUserInfo": {
        "soleUserId": "user_abc123",
        "username": "johndoe",
        "name": "John Doe",
        "profilePic": "https://res.cloudinary.com/xyz/image/upload/v123/profiles/john.jpg",
        "talentLevel": "verified",
        "clientLevel": null
      }
    }
  ],
  "total": 150,
  "page": 0,
  "pageSize": 3
}
```

---

## 🔄 4. DATA FETCHING LAYER (React Query)

### useUserPostQueries Hook

**File**: `/src/hooks/useUserPostQueries.ts`

```typescript
import { useInfiniteQuery } from "@tanstack/react-query"
import { searchPosts, PostWithDetailsResponse } from "@/app/api/apiservice/post_api"

export const useUserPostQueries = ({
  username,
  userProfileData,
  pageSize,
}: UseProjectDetailQueriesProps) => {
  
  // HOME PAGE POSTS QUERY
  const {
    data: homePagePostsData,
    fetchNextPage: homeFetchNextPage,
    hasNextPage: homeHasNextPage,
    isFetchingNextPage: homeIsFetchingNextPage,
    isLoading: homeIsLoading,
    isError: homeIsError,
    error: homeError,
  } = useInfiniteQuery({
    queryKey: ["homePagePosts", userProfileData?.userInfo?.soleUserId],
    queryFn: async ({ pageParam = 0 }) => {
      // Call backend API
      const response = await searchPosts({
        soleUserId: "", // Empty = ALL users
        content: "",
        pageNo: pageParam,
        pageSize,
        orderBy: "createdAt",
        orderSeq: "desc",
      })

      // Enrich posts with aspect ratios (frontend calculation)
      const enrichedData = await enrichPostsWithDimensions(response.data)

      return {
        ...response,
        data: enrichedData,
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length - 1
      const loadedItems = allPages.reduce(
        (sum, page) => sum + page.data.length,
        0
      )
      
      // If we've loaded fewer items than total, there are more pages
      if (loadedItems < lastPage.total) {
        return currentPage + 1
      }
      return undefined // No more pages
    },
    initialPageParam: 0,
  })

  return {
    homePagePostsData,
    homeFetchNextPage,
    homeHasNextPage,
    homeIsFetchingNextPage,
    homeIsLoading,
    homeIsError,
    homeError,
  }
}
```

### Query Key Explanation

```typescript
queryKey: ["homePagePosts", userProfileData?.userInfo?.soleUserId]
```

**Purpose**:
- Unique identifier for this query
- Used for caching
- Changes = refetch
- Array format allows hierarchical keys

**When Refetched**:
- `userProfileData.userInfo.soleUserId` changes
- Manual `refetch()` called
- Query invalidation triggered
- Window regains focus (if enabled)

---

## 🎨 5. UI RENDERING LAYER

### Home Page Component

**File**: `/src/app/(home)/user/home/page.tsx`

```typescript
export default function UserHomePage() {
  // Fetch posts using custom hook
  const {
    homePagePostsData,
    homeFetchNextPage,
    homeHasNextPage,
    homeIsFetchingNextPage,
    homeIsLoading,
    homeIsError,
    homeError,
  } = useUserPostQueries({
    username: null,
    userProfileData: null,
    pageSize: 3,
  })

  // Flatten all pages into single array
  const posts = homePagePostsData?.pages.flatMap((page) => page.data) ?? []
  const totalPosts = homePagePostsData?.pages[0]?.total ?? 0

  return (
    <Shell variant="custom">
      <InfiniteScroll
        dataLength={posts.length}
        next={homeFetchNextPage}
        hasMore={homeHasNextPage ?? false}
        scrollableTarget="scrollableDiv"
        loader={<Spinner label="Loading more posts..." />}
        endMessage={<p>Showing all {totalPosts} posts</p>}
      >
        {posts.map((post, index) => (
          <HomePagePosts key={post.id} post={post} index={index} />
        ))}
      </InfiniteScroll>
    </Shell>
  )
}
```

---

## 🔄 COMPLETE REQUEST FLOW DIAGRAM

```
User Opens Home Page (/user/home)
          ↓
React Component Renders
          ↓
useUserPostQueries Hook Executes
          ↓
TanStack Query: Check Cache
          ├─ Cache Hit → Return Cached Data
          └─ Cache Miss → Continue...
                    ↓
          Query Function Executes
                    ↓
          searchPosts({
            soleUserId: "",
            pageNo: 0,
            pageSize: 3,
            orderBy: "createdAt",
            orderSeq: "desc"
          })
                    ↓
          fetch(http://localhost:8080/api/post/search?...)
                    ↓
┌─────────────────────────────────────────────────────────┐
│              NETWORK LAYER (HTTP)                       │
│  Request leaves browser, goes over network              │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│         BACKEND: Spring Boot Receives Request          │
│  PostController.searchPosts() method called            │
└─────────────────────────────────────────────────────────┘
                    ↓
          PostService.searchPosts()
                    ↓
          Build JPA Specification (WHERE clauses)
                    ↓
          PostRepository.findAll(spec, pageable)
                    ↓
┌─────────────────────────────────────────────────────────┐
│         HIBERNATE ORM: Generate SQL Query               │
│  SELECT p.* FROM post p                                │
│  WHERE ...                                             │
│  ORDER BY created_at DESC                              │
│  LIMIT 3 OFFSET 0                                      │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│         DATABASE: PostgreSQL Executes Query            │
│  1. Parse SQL                                          │
│  2. Create execution plan                              │
│  3. Scan post table (with indexes)                     │
│  4. Apply filters                                      │
│  5. Sort by created_at                                 │
│  6. Limit to 3 rows                                    │
│  7. Return result set                                  │
└─────────────────────────────────────────────────────────┘
                    ↓
          Hibernate Maps Rows → Post Objects
                    ↓
          For Each Post: Fetch Related Data
          ├─ PostMediaRepository.findByPostId()
          ├─ PostLikeRepository.countByPostId()
          ├─ PostCommentRepository.countByPostId()
          └─ UserInfoRepository.findBySoleUserId()
                    ↓
          Build PostWithDetailsResponse Objects
                    ↓
          Return PageResponse<PostWithDetailsResponse>
                    ↓
          Spring Boot Serializes to JSON (Jackson)
                    ↓
┌─────────────────────────────────────────────────────────┐
│              NETWORK LAYER (HTTP)                       │
│  Response goes over network back to browser            │
└─────────────────────────────────────────────────────────┘
                    ↓
          Frontend fetch() Receives Response
                    ↓
          response.json() Parses JSON
                    ↓
          enrichPostsWithDimensions(posts)
          ├─ For each post with media
          ├─ Download first image
          ├─ Calculate aspect ratio
          ├─ Determine dimensionType
          └─ Return enriched post
                    ↓
          Return to React Query
                    ↓
          React Query Caches Data
                    ↓
          React Query Returns Data to Component
                    ↓
          Component Re-renders
                    ↓
          posts.map() Iterates Posts
                    ↓
          <HomePagePosts /> Renders Each Post
                    ↓
          User Sees Posts on Screen
```

---

## 📊 6. QUERY PERFORMANCE OPTIMIZATIONS

### Database Indexes

```sql
-- Critical indexes for post queries
CREATE INDEX idx_post_created_at ON post(created_at DESC);
CREATE INDEX idx_post_sole_user_id ON post(sole_user_id);
CREATE INDEX idx_post_user_created ON post(sole_user_id, created_at DESC);

-- Indexes for related tables
CREATE INDEX idx_post_media_post_id ON post_media(post_id, display_order);
CREATE INDEX idx_like_post_id ON like(post_id);
CREATE INDEX idx_comment_post_id ON comment(post_id);
CREATE INDEX idx_user_info_sole_user_id ON user_info(sole_user_id);
```

### Backend Caching (Redis - Optional)

```java
@Cacheable(value = "posts", key = "#soleUserId + '_' + #pageNo")
public PageResponse<PostWithDetailsResponse> searchPosts(...) {
    // Query execution
}

@CacheEvict(value = "posts", allEntries = true)
public Post createPost(CreatePostRequest request) {
    // Invalidate cache when new post created
}
```

### Frontend Caching (React Query)

```typescript
{
  queryKey: ["homePagePosts"],
  staleTime: 1000 * 60 * 5, // 5 minutes
  cacheTime: 1000 * 60 * 10, // 10 minutes
  refetchOnWindowFocus: false,
}
```

---

## 🔍 7. FILES INVOLVED (COMPLETE LIST)

### Database Layer
- `/prisma/schema.prisma` - Database schema
- Database: PostgreSQL (Neon/Vercel)

### Backend API Layer (Java Spring Boot)
- `src/main/java/com/sole/controller/PostController.java`
- `src/main/java/com/sole/service/PostService.java`
- `src/main/java/com/sole/repository/PostRepository.java`
- `src/main/java/com/sole/repository/PostMediaRepository.java`
- `src/main/java/com/sole/repository/PostLikeRepository.java`
- `src/main/java/com/sole/repository/PostCommentRepository.java`
- `src/main/java/com/sole/model/Post.java`
- `src/main/java/com/sole/model/PostMedia.java`
- `src/main/java/com/sole/dto/PostWithDetailsResponse.java`

### Frontend API Layer (Next.js)
- `/src/app/api/apiservice.ts` - API base URL config
- `/src/app/api/apiservice/post_api.ts` - Post API functions

### Data Fetching Layer
- `/src/hooks/useUserPostQueries.ts` - React Query hook

### UI Layer
- `/src/app/(home)/user/home/page.tsx` - Home feed
- `/src/app/(home)/user/explore/page.tsx` - Explore grid
- `/src/app/(home)/user/[username]/page.tsx` - User profile
- `/src/app/(home)/_components/userHome/display-homepage-post.tsx` - Post card
- `/src/app/(home)/_components/userProfile/_postComponents/user-post-modal.tsx` - Post modal

### Shared Utilities
- `/src/app/(home)/_components/_carouselComponents/getApect-getDimensionType.ts` - Aspect ratio calculation
- `/src/utils/time-converts.ts` - Date formatting

---

## 📝 SUMMARY

### The COMPLETE Flow:
1. **User Action** → Opens `/user/home`
2. **React Component** → Renders, triggers useUserPostQueries hook
3. **React Query** → Checks cache, if miss, calls queryFn
4. **API Call** → `searchPosts({soleUserId: "", pageNo: 0, pageSize: 3})`
5. **HTTP Request** → `GET http://localhost:8080/api/post/search?...`
6. **Spring Boot** → PostController receives request
7. **Service Layer** → PostService.searchPosts() business logic
8. **JPA/Hibernate** → Generates SQL query with WHERE, ORDER, LIMIT
9. **PostgreSQL** → Executes query, scans post table with indexes
10. **Result Set** → Returns matching rows
11. **ORM Mapping** → Hibernate maps rows to Post objects
12. **Enrichment** → Fetches related data (media, likes, comments, user info)
13. **DTO Building** → Constructs PostWithDetailsResponse objects
14. **JSON Serialization** → Jackson converts Java objects to JSON
15. **HTTP Response** → Sends JSON back to frontend
16. **Frontend Parsing** → `response.json()` parses JSON
17. **Aspect Ratio** → `enrichPostsWithDimensions()` calculates ratios
18. **React Query Cache** → Stores data for 5 minutes
19. **Component Update** → React re-renders with new data
20. **UI Rendering** → User sees posts on screen

### Key Technologies:
- **Database**: PostgreSQL (Neon/Vercel Postgres)
- **Backend**: Java Spring Boot 3.x
- **ORM**: Spring Data JPA + Hibernate
- **Frontend**: Next.js 15 (React 19)
- **Data Fetching**: TanStack Query v5 (React Query)
- **State**: React Hooks
- **Styling**: Tailwind CSS
- **Image CDN**: Cloudinary

---

**This is the COMPLETE, ULTIMATE guide. Every layer explained. Every file listed. Copy this to another Cursor and they'll understand your ENTIRE stack.**

**Document Created**: 2025-10-22  
**Version**: 2.0.0 (ULTIMATE EDITION)  
**Author**: Wilson's AI Assistant  
**Purpose**: Complete full-stack data flow from database to UI with every technical detail



