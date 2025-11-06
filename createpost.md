# 📸 Create Post System - COMPLETE TECHNICAL GUIDE

## 🎯 EXECUTIVE SUMMARY

This document provides a **comprehensive technical breakdown** of the Create Post functionality - a sophisticated image/video upload system with multi-file support, interactive cropping, aspect ratio selection, emoji integration, and optimized cloud upload. This is the core content creation feature of the platform.

---

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                      CREATE POST WORKFLOW                       │
└─────────────────────────────────────────────────────────────────┘

    User Clicks "Make a Post" Button
              ↓
    ┌─────────────────────────────────────────┐
    │  STEP 1: SELECT MEDIA                  │
    │  - Choose up to 5 images/videos        │
    │  - Multiple selection supported        │
    │  - Preview thumbnails                  │
    └─────────────────────────────────────────┘
              ↓
    ┌─────────────────────────────────────────┐
    │  STEP 2: CROP & ADJUST                 │
    │  - Carousel view (swipe between media) │
    │  - Interactive crop for each image     │
    │  - Zoom slider (1x - 5x)              │
    │  - Aspect ratio selection:             │
    │    • 1:1 (Square)                      │
    │    • 4:5 (Portrait)                    │
    │    • 16:9 (Landscape)                  │
    │  - Delete unwanted images              │
    │  - Reorder via thumbnail grid          │
    └─────────────────────────────────────────┘
              ↓
    ┌─────────────────────────────────────────┐
    │  STEP 3: ADD CAPTION & EMOJI           │
    │  - Text area (max 256 chars)           │
    │  - Emoji picker integration            │
    │  - Character counter                   │
    │  - User avatar preview                 │
    └─────────────────────────────────────────┘
              ↓
    ┌─────────────────────────────────────────┐
    │  STEP 4: SUBMIT & PROCESS              │
    │  - Build FormData with nested fields   │
    │  - Upload images to Cloudinary         │
    │  - Create post in database             │
    │  - Create post_media records           │
    │  - Invalidate queries                  │
    │  - Show success notification           │
    └─────────────────────────────────────────┘
              ↓
    Post appears in feed immediately
```

---

## 📂 FILE STRUCTURE

### Core Components
- **Main Modal**: `/src/components/create-post-modal/createpost-modal.tsx`
- **Image Input**: `/src/components/create-post-modal/createpost-modal-body-imageInput.tsx`
- **Crop & Caption**: `/src/components/create-post-modal/createpost-modal-body-cropAndPost.tsx`
- **Modal Header**: `/src/components/create-post-modal/createpost-modal-header.tsx`

### Image Processing
- **Carousel Cropper**: `/src/app/(home)/_components/_carouselComponents/carousel-cropper.tsx`
- **Image Cropper**: `/src/app/(home)/_components/_carouselComponents/carousel-imagecropper.tsx`
- **Blob Cropper**: `/src/components/image-cropper/blob-image-cropper.tsx`
- **Crop Utility**: `/src/components/image-cropper/cropimage.ts`
- **Carousel Controls**: `/src/app/(home)/_components/_carouselComponents/carousel-control.tsx`

### Context & State
- **CreatePostContext**: `/src/context/CreatePostContext.tsx`
- Manages media array, aspect ratio, modal state

### API Services
- **Post API**: `/src/app/api/apiservice/post_api.ts`
- `createPost()` function with FormData upload

### Utilities
- **Image Compression**: `/src/utils/image-compression.ts`

---

## 🔄 COMPLETE DATA FLOW (STEP-BY-STEP)

### Phase 1: Modal Initialization

**User Action**: Clicks "Make a Post" button

**Code Trigger**:
```typescript
<Button
  color="primary"
  onPress={onOpenCreatePostModal}
  className="w-full"
>
  Make a Post
</Button>
```

**State Changes**:
```typescript
const {
  createPostModalOpen, // false → true
  onOpenCreatePostModal,
} = useImageContext()
```

**Modal Renders**:
```typescript
<Modal
  isOpen={createPostModalOpen}
  placement={media.length === 0 ? "center" : "bottom"}
  classNames={{
    base: `h-[50lvh] bg-white bg-opacity-20 backdrop-blur-md`
  }}
>
  {/* Step 1: Image selection screen */}
  {media.length === 0 && <CreatePostModalImageInput />}
</Modal>
```

---

### Phase 2: Media Selection

**UI**: Large image icon with "Click to choose Images for your Post"

**Implementation**:
```typescript
export function CreatePostModalImageInput({ setMedia }) {
  const MAX_FILES = 5
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  const handleIconClick = () => {
    fileInputRef.current?.click()
  }
  
  return (
    <div onClick={handleIconClick}>
      <ImageIcon size={128} />
      <span>Click to choose Images for your Post</span>
      
      <input
        type="file"
        multiple // ✅ Multiple file selection
        accept="image/*,video/*" // ✅ Images AND videos
        onChange={(e) => {
          if (e.target.files) {
            const files = Array.from(e.target.files)
            
            // Validate max 5 files
            if (files.length > MAX_FILES) {
              alert(`You can only upload a maximum of ${MAX_FILES} files.`)
              return
            }

            // Create media objects with preview URLs
            const mediaArray = files.map((file) => {
              const url = URL.createObjectURL(file)
              const isVideo = file.type.startsWith("video/")
              return { url, isVideo, file }
            })

            setMedia(mediaArray)
          }
        }}
        ref={fileInputRef}
        style={{ display: "none" }}
      />
    </div>
  )
}
```

**What Happens**:

1. **User selects files** (1-5 images/videos)
2. **Files converted to blob URLs**: `URL.createObjectURL(file)`
3. **Media array created**:
```typescript
[
  { url: "blob:http://localhost:3000/abc123", isVideo: false, file: File },
  { url: "blob:http://localhost:3000/def456", isVideo: false, file: File },
  { url: "blob:http://localhost:3000/ghi789", isVideo: true, file: File }
]
```
4. **State updated**: `setMedia(mediaArray)`
5. **Modal transitions** to crop view

---

### Phase 3: Crop & Aspect Ratio Selection

**UI Changes**: Modal expands to full height, shows carousel

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│  [Back]                              [Share]           │ ← Header
├────────────────────────────────────────────────────────┤
│                                                        │
│                  [Main Image/Video]                   │ ← Carousel
│                  With crop overlay                     │
│                                                        │
├────────────────────────────────────────────────────────┤
│  [Crop] [Delete] [1:1 ▼] [🖼️ Thumbnails]             │ ← Toolbar
│  Zoom: ────●────────                                  │
└────────────────────────────────────────────────────────┘
```

#### A. Carousel System

**Component**: `CarouselCropper`

**Library**: `react-slick`

```typescript
import Slider from "react-slick"

const settings = {
  dots: true,
  infinite: false,
  speed: 0,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: false,
  nextArrow: <NextArrow aspect={aspect} />,
  prevArrow: <PrevArrow aspect={aspect} />,
  draggable: false,
  swipe: false,
}

return (
  <Slider {...settings}>
    {media.map((item, index) => (
      <div key={index}>
        <CarouselImageCropper
          index={index}
          image={item.url}
          isVideo={item.isVideo}
          aspect={aspect}
          onImageCropped={(croppedImage, previewImage, cropData, file) =>
            croppedImgArray(index, croppedImage, previewImage, cropData, file)
          }
        />
      </div>
    ))}
  </Slider>
)
```

**Features**:
- **Dots Navigation**: Shows which image (1/5, 2/5, etc.)
- **Arrow Buttons**: Navigate between images
- **No Swipe**: Disabled to prevent accidental navigation during crop
- **One at a Time**: Only one image visible for focused editing

#### B. Aspect Ratio Selection

**Available Ratios**:
```typescript
export const aspectRatio = [
  { key: "1/1", value: 1 / 1, label: "1:1", icon: <Square /> },
  { key: "4/5", value: 4 / 5, label: "4:5", icon: <RectangleVertical /> },
  { key: "16/9", value: 16 / 9, label: "16:9", icon: <RectangleHorizontal /> },
]
```

**Dropdown UI**:
```typescript
<Select
  label="Aspect Ratio"
  defaultSelectedKeys={["1/1"]}
  selectedKeys={selectedRatio}
  onChange={(e) => handleSelectionChange(e.target.value)}
>
  {aspectRatio.map((ratio) => (
    <SelectItem key={ratio.key} textValue={ratio.label}>
      <div className="flex items-center gap-2">
        {ratio.icon} {/* Square, Portrait, or Landscape icon */}
        <span>{ratio.label}</span>
      </div>
    </SelectItem>
  ))}
</Select>
```

**Change Handler**:
```typescript
const handleSelectionChange = (value: any) => {
  const selectedAspect = aspectRatio.find((ratio) => ratio.key === value)
  
  if (selectedAspect) {
    setAspect(selectedAspect.value) // Update aspect (e.g., 16/9)
    setSelectedRatio([selectedAspect.key]) // Update UI
    setIsCropping(true) // Trigger re-crop
    
    // Force all images to re-crop with new aspect
    setCropperKey((prev) => prev + 1)
  }
}
```

**Effect**: All images instantly re-crop to new aspect ratio

#### C. Interactive Image Cropper

**Component**: `CarouselImageCropper`

**Library**: `react-easy-crop`

```typescript
import Cropper from "react-easy-crop"

export function CarouselImageCropper({
  index,
  image,
  aspect,
  onImageCropped,
  isVideo,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropComplete = async (croppedArea, croppedAreaPixels) => {
    if (isVideo) {
      // Video: Store crop data, don't actually crop
      const cropDataWithZoom = {
        ...croppedAreaPixels,
        zoom: zoom,
        naturalWidth: 1920,
        naturalHeight: 1080,
      }
      
      const videoFile = await createVideoFile(image)
      onImageCropped(videoFile, image, cropDataWithZoom, videoFile)
    } else {
      // Image: Actually crop the image
      const imageFile = await getCroppedImg(
        index,
        "post",
        image,
        croppedAreaPixels
      )
      
      const base64 = await getCroppedBase64(image, croppedAreaPixels)
      
      const cropDataWithZoom = {
        ...croppedAreaPixels,
        zoom: zoom,
      }
      
      onImageCropped(imageFile, base64, cropDataWithZoom, imageFile)
    }
  }

  return (
    <Modal isOpen={isOpen} size="full">
      <ModalBody>
        <div className="relative h-[90vh]">
          <Cropper
            image={!isVideo ? image : null}
            video={isVideo ? image : null}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
      </ModalBody>
      
      <ModalFooter>
        <Slider
          label="Zoom"
          value={zoom}
          minValue={1}
          maxValue={5}
          step={0.1}
          onChange={(value) => setZoom(Number(value))}
        />
        
        <Button color="primary" onPress={onClose}>
          <Crop /> CROP
        </Button>
      </ModalFooter>
    </Modal>
  )
}
```

**Cropper Features**:
- **Drag**: Move crop area
- **Zoom**: Pinch or slider (1x - 5x)
- **Aspect Lock**: Maintains selected ratio
- **Real-time Preview**: See result instantly

#### D. Crop Processing (Canvas API)

**Function**: `getCroppedImg()`

**File**: `/src/components/image-cropper/cropimage.ts`

```typescript
export async function getCroppedImg(
  index: number,
  imageName: string,
  imageSrc: string,
  pixelCrop: PixelCrop,
  rotation: number = 0,
  flip: Flip = { horizontal: false, vertical: false }
): Promise<File> {
  // 1. Load original image
  const image = await createImage(imageSrc)
  
  // 2. Create canvas
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  
  // 3. Apply rotation if needed
  const rotRad = getRadianAngle(rotation)
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.translate(-image.width / 2, -image.height / 2)
  
  // 4. Draw rotated image
  ctx.drawImage(image, 0, 0)
  
  // 5. Create cropped canvas
  const croppedCanvas = document.createElement("canvas")
  croppedCanvas.width = pixelCrop.width
  croppedCanvas.height = pixelCrop.height
  
  // 6. Draw cropped section
  const croppedCtx = croppedCanvas.getContext("2d")
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )
  
  // 7. Convert canvas to Blob, then to File
  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `${imageName}${index}.jpg`, {
            type: "image/jpeg",
          })
          resolve(file)
        } else {
          reject(new Error("Failed to create blob"))
        }
      },
      "image/jpeg",
      1 // Quality: 1 = 100%
    )
  })
}
```

**Process**:
1. Load image into `<img>` element
2. Create HTML5 Canvas
3. Draw image on canvas with rotation/flip
4. Extract cropped region to new canvas
5. Convert canvas to Blob (binary data)
6. Create File object from Blob
7. Return File ready for upload

**Result**: 
- Input: Blob URL + crop coordinates
- Output: File object (JPEG, optimized)

---

### Phase 4: Caption & Emoji Input

**UI** (Step 2):
```
┌────────────────────────────────────────┐
│  [Image Preview]   │  [Caption Input] │
│  (Left Side)       │  (Right Side)    │
│                    │                  │
│                    │  ┌────────────┐  │
│                    │  │ @johndoe   │  │
│                    │  └────────────┘  │
│                    │                  │
│                    │  😊 Caption...  │
│                    │  ┌────────────┐  │
│                    │  │ Beautiful  │  │
│                    │  │ sunset!    │  │
│                    │  └────────────┘  │
│                    │  50/256 chars   │
│                    │                  │
│                    │  [Emoji Picker] │
└────────────────────────────────────────┘
```

**Caption Input**:
```typescript
<Textarea
  label="Express your thoughts"
  name="content"
  value={messageToSend}
  maxLength={MAX_CHARACTERS} // 256
  minRows={1}
  isClearable
  startContent={
    <Laugh
      className="cursor-pointer"
      onClick={() => setShowPicker(!showPicker)}
    />
  }
  onChange={(e) => handleTextareaChange(e, setFieldValue)}
  onClear={() => handleClearTextbox(setFieldValue)}
/>

<div className="text-right text-sm">
  {charCount}/{MAX_CHARACTERS} characters
</div>
```

**Character Limit Handler**:
```typescript
const handleTextareaChange = (e, setFieldValue) => {
  const value = e.target.value
  
  if (value.length <= MAX_CHARACTERS) {
    setMessageToSend(value)
    setFieldValue("content", value)
    setCharCount(value.length)
  } else {
    alert(`You can only enter up to ${MAX_CHARACTERS} characters.`)
  }
}
```

**Emoji Picker**:
```typescript
import Picker, { Theme } from "emoji-picker-react"

{showPicker && (
  <Picker
    theme={Theme.DARK}
    width={"100%"}
    onEmojiClick={(emojiObject) =>
      onEmojiClick(emojiObject, setFieldValue)
    }
  />
)}

const onEmojiClick = (emojiObject, setFieldValue) => {
  if (emojiObject?.emoji) {
    const newValue = messageToSend + emojiObject.emoji
    
    if (newValue.length <= MAX_CHARACTERS) {
      setMessageToSend(newValue)
      setFieldValue("content", newValue)
      setCharCount(newValue.length)
    }
    
    setShowPicker(false) // Auto-close after selection
  }
}
```

**Features**:
- **Emoji Categories**: Smileys, People, Animals, Food, etc.
- **Search**: Find emoji by keyword
- **Skin Tones**: Modifier support
- **Recent**: Shows recently used emojis
- **Dark Theme**: Matches app design

---

### Phase 5: Data Preparation & Submission

**Formik Values Structure**:
```typescript
interface CreatePostRequest {
  soleUserId: string
  postMedias: PostMedia[]
  content: string
}

interface PostMedia {
  file?: File | null
  cropData?: {
    x: number
    y: number
    width: number
    height: number
    zoom: number
    naturalWidth?: number
    naturalHeight?: number
  }
  isVideo: boolean
}
```

**Example Values**:
```typescript
{
  soleUserId: "user_abc123",
  content: "Beautiful sunset today! 🌅",
  postMedias: [
    {
      file: File { name: "post0.jpg", size: 245678, type: "image/jpeg" },
      cropData: {
        x: 100,
        y: 50,
        width: 800,
        height: 800,
        zoom: 1.5,
        naturalWidth: 1920,
        naturalHeight: 1080,
      },
      isVideo: false,
    },
    {
      file: File { name: "post1.jpg", size: 189234, type: "image/jpeg" },
      cropData: {
        x: 200,
        y: 100,
        width: 600,
        height: 750,
        zoom: 1.2,
        naturalWidth: 1600,
        naturalHeight: 1200,
      },
      isVideo: false,
    }
  ]
}
```

**Submit Handler**:
```typescript
const handleSubmit = async (values: CreatePostRequest) => {
  try {
    const submitValues = {
      ...values,
      soleUserId: soleUserId || values.soleUserId || "defaultUser",
    }
    
    createPostMutation.mutate(submitValues)
  } catch (error) {
    console.error("Error creating post:", error)
  }
}
```

**Mutation Setup**:
```typescript
const createPostMutation = useMutation({
  mutationFn: (values: CreatePostRequest) => createPost(values),
  onSuccess: () => {
    addToast({
      title: "Post created successfully",
      description: "Your post has been created and is now visible to others.",
      color: "success",
    })

    // Invalidate queries to refresh feeds
    queryClient.invalidateQueries({ queryKey: ["profilePagePosts"] })
    queryClient.invalidateQueries({ queryKey: ["homePagePosts"] })
    queryClient.invalidateQueries({ queryKey: ["explorePagePosts"] })

    // Close modal and reset
    handleModalClose()
  },
  onError: (error) => {
    addToast({
      title: "Failed to create post",
      description: "An error occurred while creating your post.",
      color: "danger",
    })
  },
})
```

---

### Phase 6: FormData Construction

**Function**: `createPost()`

**File**: `/src/app/api/apiservice/post_api.ts`

```typescript
export const createPost = async (
  postData: CreatePostRequest
): Promise<Post> => {
  try {
    const formData = new FormData()

    // 1. Add soleUserId
    if (postData.soleUserId) {
      formData.append("soleUserId", postData.soleUserId)
    }
    
    // 2. Add content (caption)
    formData.append("content", postData.content || "")

    // 3. Append postMedias with nested fields
    let mediaFileIndex = 0
    postData.postMedias?.forEach((media, index) => {
      
      // 3a. Append crop data with nested notation
      if (media.cropData) {
        formData.append(
          `postMedias[${index}].cropData.x`,
          media.cropData.x?.toString() || "0"
        )
        formData.append(
          `postMedias[${index}].cropData.y`,
          media.cropData.y?.toString() || "0"
        )
        formData.append(
          `postMedias[${index}].cropData.width`,
          media.cropData.width?.toString() || "0"
        )
        formData.append(
          `postMedias[${index}].cropData.height`,
          media.cropData.height?.toString() || "0"
        )
        formData.append(
          `postMedias[${index}].cropData.zoom`,
          media.cropData.zoom?.toString() || "1"
        )
        if (media.cropData.naturalWidth) {
          formData.append(
            `postMedias[${index}].cropData.naturalWidth`,
            media.cropData.naturalWidth.toString()
          )
        }
        if (media.cropData.naturalHeight) {
          formData.append(
            `postMedias[${index}].cropData.naturalHeight`,
            media.cropData.naturalHeight.toString()
          )
        }
      }

      // 3b. Append isVideo flag
      formData.append(
        `postMedias[${index}].isVideo`,
        media.isVideo?.toString() || "false"
      )

      // 3c. Append file
      if (media.file instanceof File) {
        formData.append(`postMedias[${index}].file`, media.file)
        formData.append(
          `postMedias[${index}].fileIndex`,
          mediaFileIndex.toString()
        )
        mediaFileIndex++
      }
    })

    // 4. Send to backend
    const response = await fetch(`${API_BASE_URL}/post`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Failed to create post: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error creating post:", error)
    throw error
  }
}
```

**FormData Structure** (Example with 2 images):
```
FormData:
  soleUserId: "user_abc123"
  content: "Beautiful sunset! 🌅"
  
  postMedias[0].cropData.x: "100"
  postMedias[0].cropData.y: "50"
  postMedias[0].cropData.width: "800"
  postMedias[0].cropData.height: "800"
  postMedias[0].cropData.zoom: "1.5"
  postMedias[0].cropData.naturalWidth: "1920"
  postMedias[0].cropData.naturalHeight: "1080"
  postMedias[0].isVideo: "false"
  postMedias[0].file: File (post0.jpg, 245678 bytes)
  postMedias[0].fileIndex: "0"
  
  postMedias[1].cropData.x: "200"
  postMedias[1].cropData.y: "100"
  postMedias[1].cropData.width: "600"
  postMedias[1].cropData.height: "750"
  postMedias[1].cropData.zoom: "1.2"
  postMedias[1].isVideo: "false"
  postMedias[1].file: File (post1.jpg, 189234 bytes)
  postMedias[1].fileIndex: "1"
```

---

### Phase 7: Backend Processing

**HTTP Request**:
```http
POST http://localhost:8080/api/post
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...

------WebKitFormBoundary...
Content-Disposition: form-data; name="soleUserId"

user_abc123
------WebKitFormBoundary...
Content-Disposition: form-data; name="content"

Beautiful sunset! 🌅
------WebKitFormBoundary...
Content-Disposition: form-data; name="postMedias[0].file"; filename="post0.jpg"
Content-Type: image/jpeg

[BINARY IMAGE DATA]
------WebKitFormBoundary...
Content-Disposition: form-data; name="postMedias[0].cropData.x"

100
------WebKitFormBoundary...
Content-Disposition: form-data; name="postMedias[0].cropData.width"

800
------WebKitFormBoundary...--
```

**Backend Java Controller**:
```java
@RestController
@RequestMapping("/api/post")
public class PostController {
    
    @PostMapping
    public ResponseEntity<Post> createPost(
        @RequestParam String soleUserId,
        @RequestParam String content,
        @RequestParam List<MultipartFile> files, // Array of images
        @ModelAttribute CreatePostRequest request
    ) {
        Post post = postService.createPost(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(post);
    }
}
```

**Backend Service Processing**:
```java
@Service
@Transactional
public class PostService {
    
    public Post createPost(CreatePostRequest request) {
        // 1. Create post entity
        Post post = new Post();
        post.setSoleUserId(request.getSoleUserId());
        post.setContent(request.getContent());
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());
        
        // 2. Save post to get ID
        Post savedPost = postRepository.save(post);
        
        // 3. Process each media file
        if (request.getPostMedias() != null) {
            for (int i = 0; i < request.getPostMedias().size(); i++) {
                PostMediaRequest mediaRequest = request.getPostMedias().get(i);
                
                if (mediaRequest.getFile() != null) {
                    // 4. Upload to Cloudinary
                    String mediaUrl = cloudinaryService.uploadFile(
                        mediaRequest.getFile(),
                        "posts",
                        savedPost.getId() + "_" + i
                    );
                    
                    // 5. Create post_media entity
                    PostMedia media = new PostMedia();
                    media.setPostId(savedPost.getId());
                    media.setMediaUrl(mediaUrl);
                    media.setDisplayOrder(i);
                    media.setFileName(mediaRequest.getFile().getOriginalFilename());
                    media.setFileSize(mediaRequest.getFile().getSize());
                    media.setMediaType(mediaRequest.getFile().getContentType());
                    media.setIsActive(true);
                    media.setCreatedAt(LocalDateTime.now());
                    
                    // 6. Save media record
                    postMediaRepository.save(media);
                }
            }
        }
        
        return savedPost;
    }
}
```

**Database Queries**:
```sql
-- 1. Insert post
INSERT INTO post (sole_user_id, content, created_at, updated_at)
VALUES ('user_abc123', 'Beautiful sunset! 🌅', NOW(), NOW())
RETURNING id;
-- Returns: id = 789

-- 2. Insert post media (for each image)
INSERT INTO post_media (
  post_id, 
  media_url, 
  display_order, 
  file_name, 
  file_size, 
  media_type, 
  is_active, 
  created_at
)
VALUES (
  789,
  'https://res.cloudinary.com/xyz/image/upload/v123/posts/789_0.jpg',
  0,
  'sunset.jpg',
  245678,
  'image/jpeg',
  TRUE,
  NOW()
);

INSERT INTO post_media (...)
VALUES (789, 'https://...posts/789_1.jpg', 1, ...);
```

---

## 🎨 ADDITIONAL FEATURES

### A. Delete Image

**UI**: Trash icon button in toolbar

```typescript
<Button
  isIconOnly
  variant="faded"
  color="danger"
  onPress={() => handleDelete(index)}
>
  <Trash />
</Button>

const handleDelete = (index: number) => {
  // Remove from media array
  setMedia((prevImg) => prevImg.filter((_, i) => i !== index))
  
  // Remove from cropped arrays
  croppedArray.splice(index, 1)
  updatedCroppedArray.splice(index, 1)

  // Remove from Formik values
  const currentPostMedias = formikValues?.postMedias || []
  currentPostMedias.splice(index, 1)
  setFieldValue("postMedias", [...currentPostMedias])
}
```

**Effect**: 
- Image removed from carousel
- Remaining images re-indexed
- FormData updated

### B. Thumbnail Grid Navigation

**UI**: Popover with small thumbnails

```typescript
<Popover placement="top-end">
  <PopoverTrigger>
    <Button isIconOnly variant="faded">
      <ImageIcon />
    </Button>
  </PopoverTrigger>
  
  <PopoverContent>
    <div className="flex gap-2">
      {media.map((item, idx) => (
        <Button
          key={idx}
          isIconOnly
          size="sm"
          style={{ width: "60px", height: "60px" }}
          onPress={() => jumpToSlide(idx)}
        >
          <Image
            src={item.url}
            alt={`Thumbnail ${idx + 1}`}
            style={{
              width: "60px",
              height: "60px",
              objectFit: "cover",
            }}
          />
        </Button>
      ))}
    </div>
  </PopoverContent>
</Popover>

const jumpToSlide = (index) => {
  if (sliderRef.current) {
    sliderRef.current.slickGoTo(index)
  }
}
```

**Effect**: Quick navigation to any image

### C. Image Compression

**Before Upload**:
```typescript
const compressedImage = await compressBlobImage(croppedImage, 2)
```

**Compression Levels**:
- Level 1: High quality (minimal compression)
- Level 2: Balanced (recommended)
- Level 3: Maximum compression

**Function**: `/src/utils/image-compression.ts`

```typescript
export async function compressBlobImage(
  file: File,
  compressionLevel: number = 2
): Promise<File> {
  const options = {
    maxSizeMB: compressionLevel === 1 ? 2 : compressionLevel === 2 ? 1 : 0.5,
    maxWidthOrHeight: compressionLevel === 1 ? 1920 : compressionLevel === 2 ? 1280 : 800,
    useWebWorker: true,
  }
  
  const compressed = await imageCompression(file, options)
  return compressed
}
```

**Effect**:
- Faster uploads
- Less bandwidth
- Reduced storage costs
- Maintained quality

---

## 📊 TECHNICAL SPECIFICATIONS

### Supported Media Types
- **Images**: JPEG, PNG, WebP, GIF
- **Videos**: MP4, WebM, MOV
- **Max Files**: 5 per post
- **Max File Size**: 10MB per file (recommended)

### Aspect Ratios
- **1:1 (Square)**: Instagram classic, 1080x1080
- **4:5 (Portrait)**: Instagram portrait, 1080x1350
- **16:9 (Landscape)**: Widescreen, 1920x1080

### Caption Specifications
- **Max Length**: 256 characters
- **Supports**: Unicode, emojis, line breaks
- **Clear Button**: Yes
- **Character Counter**: Live update

### Performance Optimizations
1. **Lazy Loading**: Components load on demand
2. **Image Compression**: Reduces file size by 50-80%
3. **Blob URLs**: Fast local preview before upload
4. **Canvas API**: Hardware-accelerated image processing
5. **Query Caching**: React Query caches post lists

---

## 🛠️ IMPLEMENTATION CHECKLIST

### Step 1: Set Up Context Provider
```typescript
- [ ] Create CreatePostContext.tsx
- [ ] Define MediaItem interface
- [ ] Implement ImageProvider
- [ ] Add media state (array)
- [ ] Add selectedRatio state
- [ ] Add modal open/close functions
- [ ] Wrap app with ImageProvider
```

### Step 2: Build Modal Components
```typescript
- [ ] CreatePostModal.tsx (main container)
- [ ] CreatePostModalHeader.tsx (navigation)
- [ ] CreatePostModalImageInput.tsx (file selection)
- [ ] CreatePostModalBodyCropAndPost.tsx (crop + caption)
```

### Step 3: Implement Image Selection
```typescript
- [ ] File input with multiple selection
- [ ] Accept images AND videos
- [ ] Max 5 files validation
- [ ] Create blob URLs for preview
- [ ] Detect video vs image (file.type)
- [ ] Update media state
```

### Step 4: Build Cropper System
```typescript
- [ ] Install react-easy-crop
- [ ] Install react-slick (carousel)
- [ ] Create CarouselCropper component
- [ ] Create CarouselImageCropper component
- [ ] Implement crop, zoom, rotation
- [ ] Handle video "cropping" (just metadata)
- [ ] getCroppedImg() utility function
```

### Step 5: Aspect Ratio Selection
```typescript
- [ ] Define aspect ratio options (1:1, 4:5, 16:9)
- [ ] Create dropdown with icons
- [ ] Handle ratio change
- [ ] Re-crop all images on change
- [ ] Force cropper re-render
```

### Step 6: Caption & Emoji System
```typescript
- [ ] Install emoji-picker-react
- [ ] Create Textarea with character limit
- [ ] Add emoji picker toggle button
- [ ] Implement onEmojiClick handler
- [ ] Add character counter (256 max)
- [ ] Add clear button
```

### Step 7: Form Management
```typescript
- [ ] Set up Formik with initialValues
- [ ] Define CreatePostRequest interface
- [ ] Implement handleSubmit function
- [ ] Build FormData with nested fields
- [ ] Add validation
```

### Step 8: API Integration
```typescript
- [ ] Create createPost() API function
- [ ] Use React Query useMutation
- [ ] Handle success (toast + query invalidation)
- [ ] Handle error (toast + error message)
- [ ] Invalidate profile, home, explore queries
```

### Step 9: Image Compression
```typescript
- [ ] Install browser-image-compression
- [ ] Create compressBlobImage() utility
- [ ] Configure compression levels
- [ ] Enable WebWorker for performance
```

### Step 10: Backend Implementation
```java
- [ ] PostController.createPost() endpoint
- [ ] PostService.createPost() business logic
- [ ] CloudinaryService.uploadFile() integration
- [ ] PostRepository (JPA)
- [ ] PostMediaRepository (JPA)
- [ ] Handle multipart/form-data parsing
```

---

## 🔑 KEY TECHNICAL CONCEPTS

### 1. Two-Step Modal Flow

**Why Two Steps?**:
- **Step 1**: Focus on media selection and editing
- **Step 2**: Focus on caption and final review
- Better UX (not overwhelming)
- Clear progression

**State Machine**:
```typescript
const [step, setStep] = useState(1)

{step === 1 && media.length === 0 && <ImageInput />}
{step === 1 && media.length > 0 && <CropView />}
{step === 2 && <CaptionAndPreview />}
```

### 2. Context-Based State Management

**Why Context?**:
- Modal state needs to be global
- Media array shared across components
- Aspect ratio synced everywhere
- Cleaner than prop drilling

**CreatePostContext**:
```typescript
const ImageContext = createContext<ImageContextType>({
  media: [],
  setMedia: () => {},
  selectedRatio: ["1/1"],
  setSelectedRatio: () => {},
  createPostModalOpen: false,
  onOpenCreatePostModal: () => {},
  onCloseCreatePostModal: () => {},
})
```

### 3. React Easy Crop Integration

**Library**: `react-easy-crop`

**Why?**:
- Touch-friendly (mobile support)
- Zoom with pinch or slider
- Maintains aspect ratio
- Returns crop coordinates
- Hardware accelerated

**Props**:
```typescript
<Cropper
  image={imageUrl}
  crop={crop} // { x: 0, y: 0 }
  zoom={zoom} // 1-5
  aspect={aspect} // 16/9, 1/1, 4/5
  onCropChange={setCrop}
  onCropComplete={onCropComplete}
  onZoomChange={setZoom}
/>
```

**onCropComplete Callback**:
```typescript
(croppedArea, croppedAreaPixels) => {
  // croppedArea: Percentage-based (0-100)
  // croppedAreaPixels: Pixel-based (actual coordinates)
  
  // croppedAreaPixels = { x: 100, y: 50, width: 800, height: 800 }
}
```

### 4. Canvas-Based Image Cropping

**Why Canvas?**:
- Runs in browser (client-side)
- No server processing needed
- Fast and efficient
- Supports rotation, flip
- Produces