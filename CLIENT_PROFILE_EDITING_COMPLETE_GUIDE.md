# 🏢 Client/User Profile Editing - COMPLETE TECHNICAL GUIDE

## 🎯 OVERVIEW
This document explains **EVERYTHING** about how regular user/client profiles are edited. This is the SIMPLER profile system (compared to talent profiles) that ALL users have - whether they're clients, talents, or regular users. This covers basic profile information that appears across the platform.

---

## 🏗️ COMPLETE ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                   USER/CLIENT PROFILE SYSTEM                    │
│                                                                 │
│  Basic User Information (Everyone Has This)                    │
│  ├── Profile Picture (round avatar)                           │
│  ├── Username (unique, used in URLs)                          │
│  ├── Name (display name)                                      │
│  ├── Bio (multi-line description)                             │
│  └── Categories (up to 5 selections)                          │
│      • Actor                                                   │
│      • Model                                                   │
│      • Photographer                                            │
│      • Director                                                │
│      • Producer                                                │
│      • Cinematographer                                         │
│      • Editor                                                  │
│      • Makeup Artist                                           │
│      • Stylist                                                 │
│      • Choreographer                                           │
└─────────────────────────────────────────────────────────────────┘
```

**Note**: This is DIFFERENT from Talent Profile which has measurements, snapshots, and ComCards.

---

## 📊 DATABASE SCHEMA

### Two Tables Involved

#### 1. sole_user Table
```sql
CREATE TABLE sole_user (
  id VARCHAR PRIMARY KEY, -- CUID format (e.g., "cm1abc123...")
  username VARCHAR UNIQUE, -- Used in URL: /user/{username}
  email VARCHAR UNIQUE,
  clerkId VARCHAR UNIQUE, -- Clerk authentication ID
  image VARCHAR, -- Profile picture URL (synced with Clerk)
  talent_level VARCHAR, -- null, "0", "1", "2" (talent access level)
  client_level VARCHAR, -- null, "0", "1", "2" (client access level)
  stripe_customer_id VARCHAR UNIQUE,
  stripe_subscription_id VARCHAR UNIQUE,
  stripe_price_id VARCHAR,
  stripe_current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE INDEX idx_sole_user_username ON sole_user(username);
CREATE INDEX idx_sole_user_clerkId ON sole_user(clerkId);
CREATE INDEX idx_sole_user_email ON sole_user(email);
```

**Purpose**: 
- Core authentication record
- Links to Clerk auth system
- Stores account type (talent_level, client_level)
- Stripe subscription data

#### 2. user_info Table
```sql
CREATE TABLE user_info (
  id SERIAL PRIMARY KEY,
  profile_pic VARCHAR, -- Cloudinary/MinIO URL
  name VARCHAR(100) NOT NULL, -- Display name
  bio TEXT, -- User bio/description
  category VARCHAR, -- CSV: "Actor,Model,Photographer"
  sole_user_id VARCHAR REFERENCES sole_user(id) ON DELETE CASCADE,
  bucket VARCHAR, -- "user-info" (storage bucket name)
  profile_pic_name VARCHAR -- Original filename
);

CREATE INDEX idx_user_info_sole_user_id ON user_info(sole_user_id);
CREATE UNIQUE INDEX idx_user_info_sole_user_id_unique ON user_info(sole_user_id);
```

**Purpose**: 
- Public profile information
- Displayed on posts, comments, profiles
- Searchable by other users

---

## 🔄 COMPLETE DATA FLOW

### User Profile Editing Flow

```
User Opens Own Profile (/user/{username})
    ↓
Profile Page Checks: Is this my profile?
  if (user?.username === username) {
    isUser = true → Show "Edit Info" button
  }
    ↓
User Clicks "Edit Info" in Dropdown Menu
    ↓
UserInfoForm Modal Opens (Full Screen)
    ↓
Formik Initializes with Current Values:
  ├─ profilePic: Current profile picture URL
  ├─ username: Current username
  ├─ name: Current display name
  ├─ bio: Current bio text
  └─ category: Current categories (parsed from CSV)
    ↓
User Edits Fields:
  ├─ Clicks profile picture → Image cropper opens
  ├─ Clicks Username field → Edit modal opens
  ├─ Clicks Name field → Edit modal opens
  ├─ Clicks Bio field → Text area modal opens
  └─ Clicks Categories → Multi-select modal opens
    ↓
User Clicks "Save" Button
    ↓
Form Validation Runs:
  ├─ Username: Required, unique, 3-30 chars
  ├─ Name: Required, 2-100 chars
  ├─ Bio: Optional
  └─ Categories: Max 5 selections
    ↓
Build FormData Objects (2 separate updates)
    ↓
Execute TWO Parallel Mutations:
  ├─ Mutation 1: Update user_info table
  │   └─ PUT /api/sole-user-info/sole-user/{soleUserId}
  │       ├─ profile_pic (if changed)
  │       ├─ name
  │       ├─ bio
  │       └─ category (CSV string)
  │
  └─ Mutation 2: Update sole_user table
      └─ PUT /api/sole-users/clerkId/{clerkId}
          └─ username
    ↓
Wait for Both Mutations to Complete
    ↓
Update Clerk Profile (Third-Party Service):
  ├─ Update username in Clerk
  └─ Update profile picture in Clerk (if changed)
    ↓
React Query Invalidation:
  ├─ Invalidate "userProfile" query
  └─ Invalidate "userInfo" query
    ↓
Refetch Profile Data (Automatic)
    ↓
UI Updates with New Values
    ↓
Navigate to Updated Profile URL
  ├─ If username changed: /user/{newUsername}
  └─ If same: Stay on current page
    ↓
Show Success Toast
    ↓
Modal Closes
```

---

## 📝 EDITABLE FIELDS BREAKDOWN

### 1. Profile Picture

**Component**: `CropImageInput`

**File**: `/src/components/image-cropper/crop-image-input.tsx`

**Features**:
- **Shape**: Round (circle avatar)
- **Aspect Ratio**: 1:1 (square crop)
- **Max Size**: 5MB (recommended)
- **Formats**: JPEG, PNG, WebP
- **Crop Tool**: Interactive with zoom, pan, rotate
- **Preview**: Real-time preview of cropped result

**Upload Flow**:
```
User clicks profile picture
    ↓
File picker opens
    ↓
User selects image
    ↓
BlobImageCropper opens
    ↓
User adjusts crop area (drag, zoom)
    ↓
Crop applied → Base64 string generated
    ↓
Stored in Formik: values.profilePic = "data:image/jpeg;base64,/9j/4AAQ..."
    ↓
On submit → Converted to Blob
    ↓
FormData.append("profilePic", blob, "profile-pic.jpg")
    ↓
Uploaded to Cloudinary/MinIO
    ↓
URL returned: "https://res.cloudinary.com/xyz/image/upload/v123/user-info/abc.jpg"
    ↓
Saved to database: user_info.profile_pic
```

**Code**:
```typescript
<Tooltip content="Click to Upload Icon">
  <div className="size-[20vh]">
    <CropImageInput
      shape="round"
      initialImage={initialValues.profilePic}
      fieldname="profilePic"
      index={1}
      values={values}
      setFieldValue={setFieldValue}
      isEditForm={true}
      aspect={1 / 1} // 1:1 ratio for round avatar
    />
  </div>
</Tooltip>
```

### 2. Username

**Component**: `EditFieldModal`

**Type**: Text input

**Validation**:
```typescript
export const validateUsername = (value: string): string | undefined => {
  if (!value || value.trim() === "") {
    return "Username is required"
  }
  if (value.length < 3) {
    return "Username must be at least 3 characters"
  }
  if (value.length > 30) {
    return "Username must be less than 30 characters"
  }
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return "Username can only contain letters, numbers, and underscores"
  }
  return undefined
}
```

**Updates THREE Places**:
1. `sole_user.username` (Backend database)
2. Clerk user record (Third-party auth)
3. Profile URL (Frontend navigation)

**Code**:
```typescript
<EditFieldModal
  isPressable={true}
  label="Username"
  fieldname="username"
  setFieldValue={setFieldValue}
  initialValues={initialValues}
  type="text"
  validation={validateUsername}
  touched={touched}
  isRequired={true}
  data={values}
/>
```

**UI Flow**:
```
Display: Username            johndoe          [Click to edit]
    ↓
Modal Opens:
┌──────────────────────────┐
│  Edit Username           │
│  ┌──────────────────────┐│
│  │ johndoe              ││ ← Input field
│  └──────────────────────┘│
│  ⚠️ Username must be unique│
│  [Cancel] [Save]         │
└──────────────────────────┘
```

### 3. Name

**Component**: `EditFieldModal`

**Type**: Text input

**Validation**:
```typescript
export const validateName = (value: string): string | undefined => {
  if (!value || value.trim() === "") {
    return "Name is required"
  }
  if (value.length < 2) {
    return "Name must be at least 2 characters"
  }
  if (value.length > 100) {
    return "Name must be less than 100 characters"
  }
  return undefined
}
```

**Updates**: `user_info.name`

**Code**:
```typescript
<EditFieldModal
  isPressable={true}
  label="Name"
  fieldname="name"
  setFieldValue={setFieldValue}
  initialValues={initialValues}
  type="text"
  validation={validateName}
  isRequired={true}
  data={values}
/>
```

### 4. Bio

**Component**: `EditFieldModal`

**Type**: Text area (multiline)

**Features**:
- **Multi-line**: Supports line breaks
- **Max Length**: 500 characters (recommended)
- **Validation**: Optional (not required)
- **Line Breaks**: Preserved as `\n` in database
- **Display**: Converted to `<br />` tags in UI

**Updates**: `user_info.bio`

**Code**:
```typescript
<EditFieldModal
  isPressable={true}
  label="Bio"
  fieldname="bio"
  setFieldValue={setFieldValue}
  initialValues={initialValues}
  type="textArea"
  isRequired={false}
  data={values}
/>
```

**Display with Line Breaks**:
```typescript
const DisplayTextWithBreaks = ({ text }) => {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: text.replace(/\n/g, "<br />"),
      }}
    />
  )
}

// Usage:
{userInfo?.bio && (
  <DisplayTextWithBreaks text={userInfo.bio} />
)}
```

### 5. Categories

**Component**: `CategoriesCard` + `CategoriesModal`

**File**: `/src/components/_formComponents/categories-card.tsx`

**Type**: Multi-select with chips

**Max Selections**: 5

**Available Categories**:
- Actor
- Model
- Photographer
- Director
- Producer
- Cinematographer
- Editor
- Makeup Artist
- Stylist
- Choreographer
- Writer
- Production Designer
- Costume Designer
- Sound Engineer
- Composer

**Storage Format**: CSV string
```typescript
// UI: ["Actor", "Model", "Photographer"]
// Database: "Actor,Model,Photographer"
```

**Code**:
```typescript
<CategoriesCard
  values={values}
  initialValues={initialValues}
  setFieldValue={setFieldValue}
  selectedCategories={selectedCategories}
  setSelecedCategories={setSelecedCategories}
  maxSelections={5}
/>
```

**UI Layout**:
```
┌──────────────────────────────────────────┐
│  Categories                              │
│                                          │
│  Selected:                               │
│  [Actor ×] [Model ×] [Photographer ×]   │ ← Deletable chips
│  [Clear All ×]                           │
│                                          │
│  [+ Add Categories]                      │ ← Opens modal
└──────────────────────────────────────────┘

Modal:
┌──────────────────────────────────────────┐
│  Select Categories (Max 5)               │
│  ┌────────────────────────────────────┐ │
│  │ ☐ Actor                            │ │
│  │ ☐ Model                            │ │
│  │ ☑ Photographer  ← Selected         │ │
│  │ ☐ Director                         │ │
│  │ ☐ Producer                         │ │
│  │ ☐ Cinematographer                  │ │
│  └────────────────────────────────────┘ │
│  [Cancel] [Save]                         │
└──────────────────────────────────────────┘
```

**Chip Interaction**:
```typescript
// Remove specific category
const handleRemoveCategory = (categoryToRemove: string) => {
  const filteredCategories = selectedCategories.filter(
    (category) => category !== categoryToRemove
  )
  setSelecedCategories(filteredCategories)
  setFieldValue("category", filteredCategories)
}

// Clear all categories
const handleClearAll = () => {
  setSelecedCategories([])
  setFieldValue("category", [])
}
```

**CSV Conversion**:
```typescript
// Parse from database (CSV → Array)
const categoryValue = typeof userInfo?.category === "string" 
  ? userInfo.category.split(",") 
  : []

// Save to database (Array → CSV)
category: selectedCategories.join(",")
```

---

## 🔄 COMPLETE EDIT FLOW

### Opening the Edit Form

**Trigger**: User clicks "Edit Info" in dropdown menu

**Location**: Profile page → More Options (⋮) → Edit Info

**Code**:
```typescript
// In UserInfo component
const {
  isOpen: isFormOpen,
  onOpen: onFormOpen,
  onOpenChange: onFormOpenChange,
} = useDisclosure()

<Dropdown>
  <DropdownMenu>
    {isUser && userInfo && (
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

<UserInfoForm
  username={username}
  categoryValue={filteredCategoryCHip}
  userInfo={userInfo}
  isLoading={isLoading}
  userProfileData={userProfileData}
  isOpen={isFormOpen}
  onOpen={onFormOpen}
  onOpenChange={onFormOpenChange}
  hide={true}
/>
```

---

## 🎨 UI LAYOUT (Full Screen Modal)

```
┌─────────────────────────────────────────────────────────┐
│  Edit Talent Profile                        [Close]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │         Profile Picture (Round)                 │  │
│  │         ┌───────────────┐                       │  │
│  │         │  [👤]         │ ← Click to upload     │  │
│  │         │  [📷]         │   Hover shows icon    │  │
│  │         └───────────────┘                       │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Username          johndoe              >       │  │ ← Click to edit
│  ├─────────────────────────────────────────────────┤  │
│  │  Name              John Doe             >       │  │
│  ├─────────────────────────────────────────────────┤  │
│  │  Bio               Professional actor   >       │  │
│  │                    Based in New York            │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Categories                                     │  │
│  │                                                 │  │
│  │  Selected:                                      │  │
│  │  [Actor ×] [Model ×] [Photographer ×]         │  │
│  │  [Clear All ×]                                  │  │
│  │                                                 │  │
│  │  [+ Add Categories]                             │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Footer:                                                │
│  [Save] (Loading indicator when saving)                │
│  [Cancel]                                               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 TECHNICAL IMPLEMENTATION

### 1. Formik Form Setup

**Initial Values**:
```typescript
const initialValues = {
  profilePic: userInfo.profilePic || "",
  username: username,
  name: userInfo.name || "",
  bio: userInfo.bio || "",
  category: categoryValue || [], // Array of strings
  soleUserId: userInfo?.soleUserId || "",
}
```

**Formik Component**:
```typescript
<Formik
  initialValues={initialValues}
  onSubmit={handleSubmit}
  enableReinitialize // Updates when props change
>
  {({ values, setFieldValue, resetForm, touched }) => (
    <Form>
      <Modal
        isOpen={isOpen}
        size="full"
        onClose={() => {
          onClose()
          resetForm() // Reset to initial values on cancel
        }}
      >
        <ModalContent>
          {/* Form fields */}
        </ModalContent>
      </Modal>
    </Form>
  )}
</Formik>
```

---

### 2. API Mutations (React Query)

#### Mutation 1: Update user_info

```typescript
const updateUserInfoMutation = useMutation({
  mutationFn: async (values: any) => {
    const profilePic = Array.isArray(values.profilePic)
      ? values.profilePic[1] // Get cropped image
      : values.profilePic
    
    const userInfoSubmitValues = {
      ...values,
      profilePic: profilePic,
      category: selectedCategories.join(","), // Convert array to CSV
    }
    
    return await updateUserInfoBySoleUserId(soleUserId, userInfoSubmitValues)
  },
  onSuccess: (data) => {
    addToast({
      title: "User Info updated successfully",
      color: "success",
    })
  },
  onError: (error) => {
    addToast({
      title: "Error updating User Info",
      color: "danger",
    })
  },
})
```

#### Mutation 2: Update sole_user

```typescript
const updateSoleUserMutation = useMutation({
  mutationFn: async (values: any) => {
    // Get current SoleUser data to preserve existing fields
    const currentSoleUser = await getSoleUserByClerkId(user.id)

    // Preserve all existing fields, only update username
    const soleUserSubmitValues = {
      clerkId: user.id,
      username: values.username,
      ...(currentSoleUser && {
        email: currentSoleUser.email,
        talentLevel: currentSoleUser.talentLevel,
        clientLevel: currentSoleUser.clientLevel,
        image: currentSoleUser.image,
      }),
    }
    
    return await updateSoleUserByClerkId(user.id, soleUserSubmitValues)
  },
  onSuccess: (data) => {
    addToast({
      title: "Sole User updated successfully",
      color: "success",
    })
  },
  onError: (error) => {
    addToast({
      title: "Error updating Sole User",
      color: "danger",
    })
  },
})
```

---

### 3. Parallel Execution & Clerk Sync

```typescript
const handleSubmit = async (values) => {
  try {
    // Step 1: Execute both mutations in parallel
    const [userInfoUpdate, soleUserUpdate] = await Promise.all([
      updateUserInfoMutation.mutateAsync(values),
      updateSoleUserMutation.mutateAsync(values),
    ])

    if (userInfoUpdate && soleUserUpdate) {
      // Step 2: Invalidate React Query caches
      queryClient.invalidateQueries({ queryKey: ["userProfile", username] })
      queryClient.invalidateQueries({ queryKey: ["userInfo", soleUserId] })

      // Step 3: Update Clerk authentication service
      try {
        const clerkUpdate = await user?.update({
          username: values.username,
        })

        // Step 4: Update Clerk profile picture (if changed)
        const profilePic = Array.isArray(values.profilePic)
          ? values.profilePic[1]
          : values.profilePic

        if (profilePic && profilePic !== userInfo?.profilePic) {
          const blob = base64ToBlob(profilePic)
          const profilePicUpdate = await user.setProfileImage({ file: blob })
          
          if (clerkUpdate && profilePicUpdate) {
            console.log("Clerk Update Success")
          }
        }
      } catch (e) {
        console.log("Clerk update error", e)
      }

      // Step 5: Navigate to updated profile
      onClose()
      router.push(`/user/${soleUserUpdate.username}`)
    }
  } catch (e) {
    console.log("Update error:", e)
  }
}
```

**Why Parallel Execution?**:
- Faster (both update simultaneously)
- Both must succeed (atomic-like behavior)
- If one fails, both fail
- Better UX (quicker response)

---

## 📤 API ENDPOINTS

### 1. Update User Info

**Endpoint**: `PUT /api/sole-user-info/sole-user/{soleUserId}`

**Content-Type**: `multipart/form-data`

**Request Body**:
```
FormData:
  - profilePic: File (JPEG/PNG blob)
  - name: string
  - bio: string
  - category: string (CSV)
  - bucket: "user-info"
  - soleUserId: string
```

**Backend Processing**:
```java
@PutMapping("/sole-user/{soleUserId}")
public ResponseEntity<UserInfo> updateUserInfo(
    @PathVariable String soleUserId,
    @RequestParam(required = false) MultipartFile profilePic,
    @RequestParam String name,
    @RequestParam(required = false) String bio,
    @RequestParam(required = false) String category,
    @RequestParam String bucket
) {
    // 1. Find existing user_info
    UserInfo userInfo = userInfoRepository
        .findBySoleUserId(soleUserId)
        .orElseThrow(() -> new NotFoundException("User info not found"));
    
    // 2. Upload profile picture if provided
    if (profilePic != null && !profilePic.isEmpty()) {
        String profilePicUrl = cloudinaryService.uploadFile(
            profilePic,
            bucket,
            soleUserId + "_profile"
        );
        userInfo.setProfilePic(profilePicUrl);
    }
    
    // 3. Update fields
    userInfo.setName(name);
    userInfo.setBio(bio);
    userInfo.setCategory(category);
    
    // 4. Save to database
    UserInfo updated = userInfoRepository.save(userInfo);
    
    return ResponseEntity.ok(updated);
}
```

**SQL Query**:
```sql
UPDATE user_info SET
  profile_pic = 'https://res.cloudinary.com/xyz/image/upload/v123/user-info/abc.jpg',
  name = 'John Doe',
  bio = 'Professional actor\nBased in New York',
  category = 'Actor,Model,Photographer'
WHERE sole_user_id = 'user_abc123';
```

### 2. Update Sole User

**Endpoint**: `PUT /api/sole-users/clerkId/{clerkId}`

**Content-Type**: `application/json`

**Request Body**:
```json
{
  "clerkId": "user_2abc123xyz",
  "username": "johndoe",
  "email": "john@example.com",
  "talentLevel": "1",
  "clientLevel": null,
  "image": "https://img.clerk.com/xyz"
}
```

**Backend Processing**:
```java
@PutMapping("/clerkId/{clerkId}")
public ResponseEntity<SoleUser> updateSoleUser(
    @PathVariable String clerkId,
    @RequestBody UpdateSoleUserRequest request
) {
    // 1. Find existing sole_user
    SoleUser soleUser = soleUserRepository
        .findByClerkId(clerkId)
        .orElseThrow(() -> new NotFoundException("User not found"));
    
    // 2. Update username (if changed and unique)
    if (request.getUsername() != null && 
        !request.getUsername().equals(soleUser.getUsername())) {
        // Check if username is already taken
        if (soleUserRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("Username already taken");
        }
        soleUser.setUsername(request.getUsername());
    }
    
    // 3. Preserve other fields
    soleUser.setUpdatedAt(LocalDateTime.now());
    
    // 4. Save to database
    SoleUser updated = soleUserRepository.save(soleUser);
    
    return ResponseEntity.ok(updated);
}
```

**SQL Query**:
```sql
-- Check if username is available
SELECT COUNT(*) FROM sole_user WHERE username = 'newusername';

-- Update username
UPDATE sole_user SET
  username = 'johndoe',
  updated_at = NOW()
WHERE clerkId = 'user_2abc123xyz';
```

---

## 🔐 CLERK INTEGRATION

### What is Clerk?

**Clerk** = Third-party authentication service
- Handles login/signup
- Stores user credentials
- Manages sessions
- Provides profile picture hosting
- Offers webhook for user events

### Syncing with Clerk

**Why Sync?**:
- Username needs to match across systems
- Profile picture should be consistent
- Clerk is source of truth for auth

**Update Clerk Username**:
```typescript
const clerkUpdate = await user?.update({
  username: values.username,
})
```

**Update Clerk Profile Picture**:
```typescript
// Convert base64 to Blob
const blob = base64ToBlob(profilePic)

// Upload to Clerk
const profilePicUpdate = await user.setProfileImage({ 
  file: blob 
})
```

**Clerk API Calls** (Behind the scenes):
```http
PATCH https://api.clerk.com/v1/users/{userId}
Authorization: Bearer sk_live_...
Content-Type: application/json

{
  "username": "johndoe"
}
```

---

## 🎨 EDIT FIELD MODAL SYSTEM

### How It Works

**Pattern**: Click to edit individual fields

**Display State**:
```
┌──────────────────────────────┐
│  Name          John Doe     │ ← Clickable card
└──────────────────────────────┘
```

**Edit State** (Modal opens):
```
┌──────────────────────────────┐
│  Edit Name                   │
│  ┌──────────────────────────┐│
│  │ John Doe                 ││ ← Input focused
│  └──────────────────────────┘│
│  [Cancel] [Save]             │
└──────────────────────────────┘
```

**Code**:
```typescript
<EditFieldModal
  isPressable={true}
  label="Name"
  fieldname="name"
  setFieldValue={setFieldValue}
  initialValues={initialValues}
  type="text"
  validation={validateName}
  touched={touched}
  isRequired={true}
  data={values}
/>
```

**EditFieldModal Internals**:
```typescript
const EditFieldModal = ({
  isPressable,
  label,
  fieldname,
  setFieldValue,
  initialValues,
  type,
  validation,
  data,
}) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  
  const handleCancel = () => {
    // Revert to initial value
    setFieldValue(fieldname, initialValues[fieldname])
    onOpenChange()
  }
  
  return (
    <>
      {/* Display Card */}
      <Card
        isPressable={isPressable}
        onPress={onOpen}
        className="hover:bg-gray-500"
      >
        <div>{label}</div>
        <div>{data?.[fieldname] ?? "N/A"}</div>
      </Card>
      
      {/* Edit Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalHeader>Edit {label}</ModalHeader>
        <ModalBody>
          {type === "text" && (
            <InputField
              fieldname={fieldname}
              label={label}
              validation={validation}
            />
          )}
          
          {type === "textArea" && (
            <InputField
              inputtype="textarea"
              fieldname={fieldname}
              label={label}
            />
          )}
        </ModalBody>
        <ModalFooter>
          <Button onPress={handleCancel}>Cancel</Button>
          <Button onPress={onClose}>Save</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
```

---

## 🛠️ IMPLEMENTATION CHECKLIST

### Step 1: Database Setup
```sql
- [ ] Create sole_user table with username, email, clerkId
- [ ] Create user_info table with profile_pic, name, bio, category
- [ ] Add foreign key: user_info.sole_user_id → sole_user.id
- [ ] Add unique constraint on sole_user.username
- [ ] Create indexes on frequently queried fields
```

### Step 2: Backend API
```java
- [ ] UserInfoController.java
- [ ] UserInfoService.java
- [ ] UserInfoRepository.java
- [ ] SoleUserRepository.java
- [ ] Endpoint: PUT /api/sole-user-info/sole-user/{id}
- [ ] Endpoint: PUT /api/sole-users/clerkId/{id}
- [ ] Endpoint: GET /api/sole-user-info/sole-user/{id}
- [ ] CloudinaryService.java (image upload)
```

### Step 3: Frontend API Functions
```typescript
- [ ] updateUserInfoBySoleUserId() in userInfo_api.ts
- [ ] updateSoleUserByClerkId() in apiservice.ts
- [ ] getSoleUserByClerkId() in apiservice.ts
```

### Step 4: Form Components
```typescript
- [ ] UserInfoForm.tsx (main edit modal)
- [ ] EditFieldModal.tsx (individual field editor)
- [ ] CategoriesCard.tsx (category selector)
- [ ] CategoriesModal.tsx (category picker modal)
- [ ] CropImageInput.tsx (image upload + crop)
- [ ] BlobImageCropper.tsx (crop tool)
```

### Step 5: Validation
```typescript
- [ ] validateUsername() - 3-30 chars, alphanumeric + underscore
- [ ] validateName() - 2-100 chars
- [ ] validateBio() - optional, max 500 chars
- [ ] validateCategories() - max 5 selections
```

### Step 6: State Management
```typescript
- [ ] useDisclosure() for modal open/close
- [ ] Formik for form state
- [ ] useMutation() for API calls
- [ ] useState() for selectedCategories
- [ ] useQueryClient() for cache invalidation
```

### Step 7: Clerk Integration
```typescript
- [ ] Install @clerk/nextjs
- [ ] Configure Clerk provider
- [ ] Implement user?.update() for username
- [ ] Implement user.setProfileImage() for avatar
- [ ] Handle Clerk webhooks for user creation
```

### Step 8: Image Handling
```typescript
- [ ] Implement image cropper (react-easy-crop)
- [ ] Base64 to Blob conversion utility
- [ ] FormData multipart upload
- [ ] Cloudinary SDK integration
- [ ] Image optimization (compression)
```

### Step 9: UI/UX
```typescript
- [ ] Full-screen modal for editing
- [ ] Toast notifications for feedback
- [ ] Loading states during save
- [ ] Error messages for validation
- [ ] Skeleton loaders while fetching
```

---

## 📝 SUMMARY

### Editable Fields (5 Total)
1. **Profile Picture** - Round avatar, 1:1 crop, image upload
2. **Username** - Unique identifier, 3-30 chars, alphanumeric
3. **Name** - Display name, 2-100 chars
4. **Bio** - Multi-line description, max 500 chars
5. **Categories** - Multi-select, max 5, CSV storage

### Tables Updated (2 Total)
1. **sole_user** - Username
2. **user_info** - Profile pic, name, bio, category

### External Services Synced (1 Total)
1. **Clerk** - Username, profile picture

### Technologies Used
- **Form**: Formik (state management)
- **Validation**: Custom validators
- **Image Crop**: react-easy-crop
- **Upload**: FormData multipart
- **Storage**: Cloudinary/MinIO
- **Mutations**: React Query useMutation
- **UI**: HeroUI (Modal, Button, Input)
- **Auth**: Clerk
- **Notifications**: HeroUI Toast

### Key Patterns
- **Modal-based editing** - Full screen modal
- **Field-level editing** - Individual field modals
- **Parallel mutations** - Multiple updates at once
- **Query invalidation** - Auto UI refresh
- **Clerk sync** - Keep auth in sync
- **CSV storage** - Array to string conversion

---

**This guide covers EVERYTHING about user/client profile editing. Copy and paste to another Cursor for complete understanding.**

**Document Created**: 2025-10-22  
**Version**: 1.0.0 (CLIENT/USER EDITION)  
**Purpose**: Complete technical guide for user/client profile editing system with every detail explained

