# 🎭 Talent Profile Editing - COMPLETE TECHNICAL GUIDE

## 🎯 OVERVIEW
This document explains **EVERYTHING** about how talent profiles are created, edited, and updated - from the UI form to the database. This covers the complete talent onboarding flow, ComCard generation, image uploads, and data synchronization across THREE different tables.

---

## 🏗️ COMPLETE ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                    TALENT PROFILE SYSTEM                        │
│                                                                 │
│  User Profile (Basic Info)                                     │
│  ├── Profile Picture                                           │
│  ├── Username                                                  │
│  ├── Name                                                      │
│  ├── Bio                                                       │
│  └── Categories (up to 5): [Actor] [Model] [Photographer]    │
│                                                                 │
│  Talent Info (Professional Details)                            │
│  ├── Personal: Talent Name, Gender, Eye Color, Hair Color     │
│  ├── Measurements: Age, Height, Chest, Waist, Hip, Shoes      │
│  ├── Background: Ethnic, Region                               │
│  ├── Experience: Professional history                          │
│  └── Portfolio: Half-body & Full-body snapshots               │
│                                                                 │
│  ComCard (Digital Business Card)                               │
│  ├── Template Selection                                        │
│  ├── 5 Photos (drag & drop reorderable)                       │
│  ├── Talent Name Color                                         │
│  ├── PDF Export                                               │
│  └── PNG Preview                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE SCHEMA

### Three Tables Involved

#### 1. sole_user Table
```sql
CREATE TABLE sole_user (
  id VARCHAR PRIMARY KEY, -- CUID format
  username VARCHAR UNIQUE,
  email VARCHAR UNIQUE,
  clerkId VARCHAR UNIQUE, -- Clerk authentication ID
  image VARCHAR, -- Profile picture URL
  talent_level VARCHAR, -- "0", "1", "2", etc. (access level)
  client_level VARCHAR, -- "0", "1", "2", etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);
```

**Purpose**: Core user authentication and account status

#### 2. user_info Table
```sql
CREATE TABLE user_info (
  id SERIAL PRIMARY KEY,
  profile_pic VARCHAR, -- Cloudinary/MinIO URL
  name VARCHAR(100) NOT NULL,
  bio TEXT,
  category VARCHAR, -- CSV: "Actor,Model,Photographer,Director,Producer"
  sole_user_id VARCHAR REFERENCES sole_user(id),
  bucket VARCHAR, -- "user-info" (storage bucket)
  profile_pic_name VARCHAR
);
```

**Purpose**: Public profile information

#### 3. talent_info Table
```sql
CREATE TABLE talent_info (
  id SERIAL PRIMARY KEY,
  talent_name VARCHAR(100) NOT NULL,
  gender VARCHAR(20), -- "Male", "Female", "Non-binary", "Other"
  eye_color VARCHAR(50), -- "Brown", "Blue", "Green", "Hazel", etc.
  hair_color VARCHAR(50), -- "Black", "Brown", "Blonde", "Red", etc.
  age INTEGER,
  height DECIMAL(5,2), -- in cm (e.g., 175.5)
  chest DECIMAL(5,2), -- in cm
  waist DECIMAL(5,2), -- in cm
  hip DECIMAL(5,2), -- in cm
  shoes INTEGER, -- EU size (e.g., 42)
  ethnic VARCHAR(50), -- "Asian", "Caucasian", "African", etc.
  region VARCHAR(50), -- "North America", "Europe", "Asia", etc.
  experience TEXT, -- Professional experience description
  snapshot_halfbody VARCHAR, -- Cloudinary/MinIO URL
  snapshot_fullbody VARCHAR, -- Cloudinary/MinIO URL
  bucket VARCHAR, -- "talentinformation"
  sole_user_id VARCHAR REFERENCES sole_user(id),
  comcard_id VARCHAR
);
```

**Purpose**: Professional talent information

#### 4. comcard Table
```sql
CREATE TABLE comcard (
  id SERIAL PRIMARY KEY,
  config_id INTEGER, -- Template ID (1, 2, 3, etc.)
  photo_config TEXT, -- JSON or serialized photo config
  is_active BOOLEAN DEFAULT TRUE,
  sole_user_id VARCHAR REFERENCES sole_user(id),
  pdf VARCHAR, -- PDF export URL
  png VARCHAR, -- PNG preview URL
  bucket VARCHAR, -- "comcards"
  comcard_image_name VARCHAR,
  length INTEGER, -- Number of photos (usually 5)
  talent_name_color VARCHAR -- "black", "white", etc.
);
```

**Purpose**: Digital business card (portfolio showcase)

#### 5. comcard_photo Table
```sql
CREATE TABLE comcard_photo (
  id SERIAL PRIMARY KEY,
  comcard_id INTEGER REFERENCES comcard(id) ON DELETE CASCADE,
  photo_url VARCHAR NOT NULL,
  display_order INTEGER NOT NULL, -- 0-4 for 5 photos
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Individual photos in ComCard

---

## 🔄 COMPLETE DATA FLOW

### Initial State: User Registration

```
1. User signs up with Clerk
    ↓
2. Webhook creates sole_user (talent_level: null)
    ↓
3. Webhook creates user_info (basic profile)
    ↓
4. User can post, browse, apply for jobs
    ↓
5. To become talent: Enter referral code
    ↓
6. talent_level: null → "0" (unlocked but incomplete)
    ↓
7. Fill talent form → Creates talent_info + comcard
    ↓
8. talent_level: "0" → "1" (active talent)
```

### Talent Profile Editing Flow

```
User Opens Profile Page (/user/{username})
    ↓
UserProfile Component Renders
    ↓
Fetches User Profile Data:
  ├─ sole_user (username, talent_level)
  ├─ user_info (profile pic, bio, categories)
  ├─ talent_info (measurements, snapshots)
  └─ comcard (digital card with photos)
    ↓
Determines Profile State:
  ├─ talent_level === null → Show "Activate Talent Account"
  ├─ talent_level === "0" → Show "Create Talent Profile"
  └─ talent_level > "0" → Show "Edit Talent Profile"
    ↓
User Clicks "Edit Talent Profile" Button
    ↓
TalentProfileForm Modal Opens (Full Screen)
    ↓
Formik Form Initialized with Current Values
    ↓
User Edits Fields:
  ├─ Personal Info (name, gender, eyes, hair)
  ├─ Measurements (age, height, chest, waist, hip, shoes)
  ├─ Background (ethnic, region)
  ├─ Experience (text area)
  ├─ Snapshots (half-body, full-body photos)
  └─ ComCard (5 photos, template, colors)
    ↓
User Clicks "Save" Button
    ↓
Form Validation Runs
  ├─ All required fields filled?
  ├─ Numbers in valid range?
  ├─ Images uploaded?
  └─ If errors → Show validation messages
    ↓
Build FormData Object (multipart/form-data)
  ├─ talentInfo.* fields
  ├─ comcard.* fields
  ├─ Image files (File objects)
  └─ Photo positions for ComCard
    ↓
API Call: PUT /api/talent-info/with-comcard/sole-user/{soleUserId}
    ↓
Backend Receives FormData
    ↓
Backend Processing:
  ├─ Upload images to Cloudinary/MinIO
  ├─ Update talent_info table
  ├─ Update comcard table
  ├─ Update/Create comcard_photo records
  └─ Generate ComCard PNG and PDF
    ↓
Backend Returns Success Response
    ↓
Frontend React Query Invalidation
  ├─ Invalidate "userProfile" query
  ├─ Invalidate "talentInfo" query
  └─ Refetch to get updated data
    ↓
UI Updates Automatically
    ↓
Show Success Toast
    ↓
Modal Closes
```

---

## 📝 EDITABLE FIELDS (COMPLETE LIST)

### User Profile Fields (UserInfoForm)

**File**: `/src/app/(home)/_components/userProfile/_userInfoComponents/userinfo-form.tsx`

#### 1. Profile Picture
- **Type**: Image (with crop functionality)
- **Component**: `CropImageInput`
- **Shape**: Round (1:1 aspect ratio)
- **Upload**: Base64 → Blob → FormData
- **Storage**: Cloudinary or MinIO (bucket: "user-info")
- **Updates**: 
  - `user_info.profile_pic`
  - `sole_user.image` (Clerk sync)

#### 2. Username
- **Type**: Text input
- **Field**: `username`
- **Validation**: 
  - Required
  - Unique across all users
  - No special characters
  - 3-30 characters
- **Updates**: `sole_user.username`
- **Side Effect**: Also updates Clerk authentication record

#### 3. Name
- **Type**: Text input
- **Field**: `name`
- **Validation**: 
  - Required
  - 2-100 characters
- **Updates**: `user_info.name`

#### 4. Bio
- **Type**: Text area (multiline)
- **Field**: `bio`
- **Validation**: Optional
- **Max Length**: 500 characters
- **Supports**: Line breaks (preserved as \n)
- **Updates**: `user_info.bio`

#### 5. Categories
- **Type**: Multi-select (up to 5)
- **Component**: `CategoriesCard` + `CategoriesModal`
- **Options**: 
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
- **Storage**: CSV string ("Actor,Model,Photographer")
- **Updates**: `user_info.category`
- **Display**: Rendered as chips

---

### Talent Info Fields (TalentProfileForm)

**File**: `/src/app/(home)/_components/userProfile/_talentProfileComponents/talent-profile-form.tsx`

#### Personal Information Section

##### 6. Talent Name
- **Type**: Text input
- **Field**: `talentName`
- **Validation**: Required
- **Updates**: `talent_info.talent_name`

##### 7. Gender
- **Type**: Dropdown select
- **Field**: `gender`
- **Options**: Male, Female, Non-binary, Other
- **Validation**: Required
- **Updates**: `talent_info.gender`

##### 8. Eye Color
- **Type**: Dropdown select
- **Field**: `eyeColor`
- **Options**: Brown, Blue, Green, Hazel, Gray, Amber
- **Validation**: Required
- **Updates**: `talent_info.eye_color`

##### 9. Hair Color
- **Type**: Dropdown select
- **Field**: `hairColor`
- **Options**: Black, Brown, Blonde, Red, Gray, White, Other
- **Validation**: Required
- **Updates**: `talent_info.hair_color`

#### Physical Measurements Section

##### 10. Age
- **Type**: Number input
- **Field**: `age`
- **Validation**: Required, 16-100
- **Updates**: `talent_info.age`

##### 11. Height
- **Type**: Number input
- **Field**: `height`
- **Unit**: cm
- **Range**: 100-250 cm
- **Validation**: Required
- **Updates**: `talent_info.height`

##### 12. Chest
- **Type**: Number input
- **Field**: `chest`
- **Unit**: cm
- **Range**: 60-150 cm
- **Validation**: Required
- **Updates**: `talent_info.chest`

##### 13. Waist
- **Type**: Number input
- **Field**: `waist`
- **Unit**: cm
- **Range**: 50-150 cm
- **Validation**: Required
- **Updates**: `talent_info.waist`

##### 14. Hip
- **Type**: Number input
- **Field**: `hip`
- **Unit**: cm
- **Range**: 60-150 cm
- **Validation**: Required
- **Updates**: `talent_info.hip`

##### 15. Shoes
- **Type**: Number input
- **Field**: `shoes`
- **Unit**: EU size
- **Range**: 30-50
- **Validation**: Required
- **Updates**: `talent_info.shoes`

#### Background Information Section

##### 16. Ethnic
- **Type**: Dropdown with sections
- **Field**: `ethnic`
- **Options**: Asian, Caucasian, African, Hispanic, Middle Eastern, Pacific Islander, Mixed
- **Validation**: Required
- **Updates**: `talent_info.ethnic`

##### 17. Region
- **Type**: Text input
- **Field**: `region`
- **Examples**: "North America", "Southeast Asia", "Europe"
- **Validation**: Required
- **Updates**: `talent_info.region`

#### Professional Experience Section

##### 18. Experience
- **Type**: Text area
- **Field**: `experience`
- **Validation**: Optional
- **Max Length**: 1000 characters
- **Updates**: `talent_info.experience`

#### Portfolio Section

##### 19. Half-Body Snapshot
- **Type**: Image upload with crop
- **Field**: `snapshotHalfBody`
- **Aspect**: Free (user crops)
- **Required**: Yes
- **Storage**: Cloudinary (bucket: "talentinformation")
- **Updates**: `talent_info.snapshot_halfbody`

##### 20. Full-Body Snapshot
- **Type**: Image upload with crop
- **Field**: `snapshotFullBody`
- **Aspect**: Free (user crops)
- **Required**: Yes
- **Storage**: Cloudinary (bucket: "talentinformation")
- **Updates**: `talent_info.snapshot_fullbody`

---

### ComCard Fields

#### 21. Template Selection
- **Type**: Radio/Select
- **Field**: `configId`
- **Options**: Template 1, Template 2, Template 3
- **Default**: Template 1
- **Updates**: `comcard.config_id`

#### 22. ComCard Photos (5 photos)
- **Type**: Image grid (drag & drop)
- **Field**: `photoConfig` (array of 5)
- **Format**: Array of File objects or URLs
- **Reorderable**: Yes (drag & drop)
- **Each Photo Stored**: `comcard_photo.photo_url`
- **Display Order**: `comcard_photo.display_order` (0-4)

#### 23. Talent Name Color
- **Type**: Color picker
- **Field**: `talentNameColor`
- **Options**: Black, White, Custom
- **Updates**: `comcard.talent_name_color`

#### 24. PDF Export
- **Type**: Auto-generated
- **Field**: `pdf`
- **Generated**: Server-side from PNG
- **Storage**: Cloudinary (bucket: "comcards")
- **Updates**: `comcard.pdf`

---

## 🎨 UI LAYOUT

### Full Screen Modal Form

```
┌─────────────────────────────────────────────────────────┐
│  Header: "Edit Talent Profile"          [Close] [X]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Template Selection                             │  │
│  │  ○ Template 1  ○ Template 2  ○ Template 3     │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  ComCard Preview (Live Update)                  │  │
│  │  ┌───┬───┬───┐                                  │  │
│  │  │ 1 │ 2 │ 3 │ ← Drag & drop to reorder        │  │
│  │  ├───┴───┴───┤                                  │  │
│  │  │ 4     5   │                                  │  │
│  │  └───────────┘                                  │  │
│  │  [Talent Name]                                  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  PDF Preview & Download                         │  │
│  │  [Generate PDF] [Download]                      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Personal Information                           │  │
│  │  ┌─────────────┬─────────────┐                 │  │
│  │  │ Talent Name │ Gender      │ ← Click to edit │  │
│  │  ├─────────────┼─────────────┤                 │  │
│  │  │ Eye Color   │ Hair Color  │                 │  │
│  │  └─────────────┴─────────────┘                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Physical Measurements                          │  │
│  │  ┌─────────┬─────────┬─────────┬─────────┐    │  │
│  │  │ Age     │ Height  │ Chest   │ Waist   │    │  │
│  │  ├─────────┼─────────┼─────────┼─────────┤    │  │
│  │  │ 28      │ 175 cm  │ 95 cm   │ 75 cm   │    │  │
│  │  └─────────┴─────────┴─────────┴─────────┘    │  │
│  │  ┌─────────┬─────────┐                         │  │
│  │  │ Hip     │ Shoes   │                         │  │
│  │  ├─────────┼─────────┤                         │  │
│  │  │ 90 cm   │ 42 EU   │                         │  │
│  │  └─────────┴─────────┘                         │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Background Information                         │  │
│  │  ┌─────────────┬─────────────┐                 │  │
│  │  │ Ethnic      │ Region      │                 │  │
│  │  ├─────────────┼─────────────┤                 │  │
│  │  │ Asian       │ Southeast..│                 │  │
│  │  └─────────────┴─────────────┘                 │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Professional Experience                        │  │
│  │  ┌─────────────────────────────────────────┐   │  │
│  │  │ 5 years of professional acting           │   │  │
│  │  │ Featured in multiple TV commercials      │   │  │
│  │  │ Experience in theatre and film           │   │  │
│  │  └─────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Portfolio Snapshots                            │  │
│  │  ┌──────────────┐  ┌──────────────┐           │  │
│  │  │  Half-Body   │  │  Full-Body   │           │  │
│  │  │  Snapshot    │  │  Snapshot    │           │  │
│  │  │  [Upload]    │  │  [Upload]    │           │  │
│  │  └──────────────┘  └──────────────┘           │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Footer:                                                │
│  [Save] [Cancel]                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 TECHNICAL IMPLEMENTATION

### 1. UserInfoForm Component

**File**: `/src/app/(home)/_components/userProfile/_userInfoComponents/userinfo-form.tsx`

**Editable Fields**:
```typescript
const userInformationFields = [
  {
    label: "Username",
    fieldname: "username",
    type: "text",
    validation: validateUsername,
  },
  {
    label: "Name",
    fieldname: "name",
    type: "text",
    validation: validateName,
  },
  {
    label: "Bio",
    fieldname: "bio",
    type: "textArea",
  },
]
```

**Initial Values**:
```typescript
const initialValues = {
  profilePic: userInfo.profilePic || "",
  username: username,
  name: userInfo.name || "",
  bio: userInfo.bio || "",
  category: categoryValue || [],
  soleUserId: userInfo?.soleUserId || "",
}
```

**Form Submit Handler**:
```typescript
const handleSubmit = async (values) => {
  try {
    // Execute TWO mutations in parallel
    const [userInfoUpdate, soleUserUpdate] = await Promise.all([
      updateUserInfoMutation.mutateAsync(values),
      updateSoleUserMutation.mutateAsync(values),
    ])

    if (userInfoUpdate && soleUserUpdate) {
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["userProfile", username] })
      queryClient.invalidateQueries({ queryKey: ["userInfo", soleUserId] })

      // Update Clerk profile
      const clerkUpdate = await user?.update({
        username: values.username,
      })

      // Handle profile picture update in Clerk
      const profilePic = Array.isArray(values.profilePic)
        ? values.profilePic[1]
        : values.profilePic

      if (profilePic && profilePic !== userInfo?.profilePic) {
        const blob = base64ToBlob(profilePic)
        const profilePicUpdate = await user.setProfileImage({ file: blob })
      }

      // Navigate to updated profile
      onClose()
      router.push(`/user/${soleUserUpdate.username}`)
    }
  } catch (e) {
    console.log("Update error:", e)
  }
}
```

**API Mutation: Update User Info**

```typescript
const updateUserInfoMutation = useMutation({
  mutationFn: async (values: any) => {
    const profilePic = Array.isArray(values.profilePic)
      ? values.profilePic[1]
      : values.profilePic
    
    const userInfoSubmitValues = {
      ...values,
      profilePic: profilePic,
      category: selectedCategories.join(","), // Array → CSV
    }
    
    return await updateUserInfoBySoleUserId(soleUserId, userInfoSubmitValues)
  },
  onSuccess: (data) => {
    addToast({
      title: "User Info updated successfully",
      description: "User Info updated successfully",
      color: "success",
    })
  },
  onError: (error) => {
    addToast({
      title: "Error updating User Info",
      description: "Error updating User Info",
      color: "danger",
    })
  },
})
```

**API Function**: `updateUserInfoBySoleUserId`

**File**: `/src/app/api/apiservice/userInfo_api.ts`

```typescript
export const updateUserInfoBySoleUserId = async (
  soleUserId: string,
  values: any
) => {
  try {
    const formData = new FormData()

    // Handle profile picture conversion
    Object.keys(values).forEach((key) => {
      if (key === "profilePic" && values[key]) {
        // Convert base64 to blob
        if (typeof values[key] === "string" && values[key].startsWith("data:")) {
          const base64Data = values[key].split(",")[1]
          const byteCharacters = atob(base64Data)
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          const blob = new Blob([byteArray], { type: "image/jpeg" })
          formData.append("profilePic", blob, "profile-pic.jpg")
        } else if (values[key] instanceof File) {
          formData.append("profilePic", values[key])
        }
      } else if (key !== "profilePic") {
        formData.append(key, values[key] || "")
      }
    })

    formData.append("bucket", "user-info")

    const response = await fetch(
      `${API_BASE_URL}/sole-user-info/sole-user/${soleUserId}`,
      {
        method: "PUT",
        body: formData,
      }
    )

    if (response.ok) {
      const result = await response.json()
      return result
    }
  } catch (error) {
    console.error("Error updating User Info:", error)
    throw error
  }
}
```

**HTTP Request**:
```http
PUT http://localhost:8080/api/sole-user-info/sole-user/{soleUserId}
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...

------WebKitFormBoundary...
Content-Disposition: form-data; name="profilePic"; filename="profile-pic.jpg"
Content-Type: image/jpeg

[BINARY IMAGE DATA]
------WebKitFormBoundary...
Content-Disposition: form-data; name="name"

John Doe
------WebKitFormBoundary...
Content-Disposition: form-data; name="bio"

Professional actor based in NY
------WebKitFormBoundary...
Content-Disposition: form-data; name="category"

Actor,Model,Photographer
------WebKitFormBoundary...
Content-Disposition: form-data; name="bucket"

user-info
------WebKitFormBoundary...--
```

---

### 2. TalentProfileForm Component

**File**: `/src/app/(home)/_components/userProfile/_talentProfileComponents/talent-profile-form.tsx`

**Initial Values Setup**:
```typescript
const initialValues = {
  // ComCard fields
  configId: comcard?.configId || 1,
  talentNameColor: comcard?.talentNameColor || "black",
  photoConfig: getPhotoConfig(), // Array of 5 photo URLs
  pdf: "",
  length: comcard?.length || 5,
  
  // Talent Info fields
  talentName: talentInfo?.talentName || "",
  gender: talentInfo?.gender || "",
  eyeColor: talentInfo?.eyeColor || "",
  hairColor: talentInfo?.hairColor || "",
  age: talentInfo?.age || "",
  height: talentInfo?.height || "",
  chest: talentInfo?.chest || "",
  waist: talentInfo?.waist || "",
  hip: talentInfo?.hip || "",
  shoes: talentInfo?.shoes || "",
  ethnic: talentInfo?.ethnic || "",
  region: talentInfo?.region || "",
  experience: talentInfo?.experience || "",
  
  // Portfolio snapshots
  snapshotHalfBody: talentInfo?.snapshotHalfBody || "/images/emptyphoto.jpeg",
  snapshotFullBody: talentInfo?.snapshotFullBody || "/images/emptyphoto.jpeg",
  
  // Metadata
  soleUserId: soleUserId || "",
  comcardId: comcard?.id || "",
}
```

**Form Validation**:
```typescript
const talentInfohasErrors = [
  validateField(values.talentName, "talentName"),
  validateField(values.gender, "gender"),
  validateField(values.eyeColor, "eyeColor"),
  validateField(values.hairColor, "hairColor"),
  validateNumberField(values.age, "age"),
  validateNumberField(values.height, "height"),
  validateNumberField(values.chest, "chest"),
  validateNumberField(values.waist, "waist"),
  validateNumberField(values.hip, "hip"),
  validateNumberField(values.shoes, "shoes"),
  validateField(values.ethnic, "ethnic"),
  validateField(values.region, "region"),
  validateImageField(values.snapshotHalfBody, "Half Body Photo"),
  validateImageField(values.snapshotFullBody, "Full Body Photo"),
].some((error) => error)

const hasErrors = talentInfohasErrors
```

**Submit Handler**:
```typescript
const handleSubmit = async (values) => {
  const talentData = {
    talentName: values.talentName || "",
    gender: values.gender || "",
    eyeColor: values.eyeColor || "",
    hairColor: values.hairColor || "",
    age: values.age || null,
    height: values.height || null,
    chest: values.chest || null,
    waist: values.waist || null,
    hip: values.hip || null,
    shoes: values.shoes || null,
    ethnic: values.ethnic || "",
    region: values.region || "",
    experience: values.experience || "",
    bucket: "talentinformation",
    soleUserId: soleUserId || "",
    snapshotHalfBody: values.snapshotHalfBody[0] || "",
    snapshotFullBody: values.snapshotFullBody[0] || "",
  }

  const comcardData = {
    ...(method === "PUT" && values.comcardId ? { id: values.comcardId } : {}),
    configId: "1",
    photoConfig: values.photoConfig,
    isActive: "true",
    soleUserId: soleUserId || "",
    pdf: values.pdf || "",
    bucket: "comcards",
    comcardImageName: soleUserId || "",
    length: 5,
    talentNameColor: values.talentNameColor || "black",
  }
  
  try {
    if (method === "PUT") {
      const result = await updateTalentInfoWithComcardBySoleUserId({
        soleUserId,
        talentData,
        comcardData,
      })
      if (result) {
        addToast({
          title: "Success",
          description: "Talent profile updated successfully",
          color: "success",
        })
        refetch()
      }
    } else if (method === "POST") {
      const result = await createTalentInfoWithComcard(
        soleUserId,
        talentData,
        comcardData
      )
      if (result) {
        // Set talent level to "1" (active talent)
        await updateTalentLevelBySoleUserId(
          soleUserId,
          { talentLevel: "1" }
        )
        
        addToast({
          title: "Success",
          description: "Talent profile created successfully",
          color: "success",
        })
        refetch()
      }
    }
  } catch (error) {
    console.error("Submission error:", error)
    addToast({
      title: "Error",
      description: "Failed to submit talent profile",
      color: "danger",
    })
  }
}
```

---

## 📤 API CALLS IN DETAIL

### Update Talent Info with ComCard

**Function**: `updateTalentInfoWithComcardBySoleUserId`

**File**: `/src/app/api/apiservice/talentInfo_api.ts`

```typescript
export const updateTalentInfoWithComcardBySoleUserId = async ({
  soleUserId,
  talentData,
  comcardData,
}: any): Promise<any> => {
  try {
    const formData = new FormData()

    // Append nested talentInfo fields
    formData.append("talentInfo.talentName", talentData.talentName)
    formData.append("talentInfo.gender", talentData.gender)
    formData.append("talentInfo.eyeColor", talentData.eyeColor)
    formData.append("talentInfo.hairColor", talentData.hairColor)
    formData.append("talentInfo.age", talentData.age)
    formData.append("talentInfo.height", talentData.height)
    formData.append("talentInfo.chest", talentData.chest)
    formData.append("talentInfo.waist", talentData.waist)
    formData.append("talentInfo.hip", talentData.hip)
    formData.append("talentInfo.shoes", talentData.shoes)
    formData.append("talentInfo.ethnic", talentData.ethnic)
    formData.append("talentInfo.region", talentData.region)
    formData.append("talentInfo.experience", talentData.experience)
    formData.append("talentInfo.bucket", talentData.bucket)
    formData.append("talentInfo.soleUserId", soleUserId)
    
    // Snapshot images (if changed)
    if (talentData.snapshotHalfBody) {
      formData.append(
        "talentInfo.snapshotHalfBodyImage",
        talentData.snapshotHalfBody
      )
    }
    if (talentData.snapshotFullBody) {
      formData.append(
        "talentInfo.snapshotFullBodyImage",
        talentData.snapshotFullBody
      )
    }

    // Append nested comcard fields
    if (comcardData.id) {
      formData.append("comcard.id", comcardData.id.toString())
    }
    formData.append("comcard.configId", "1")
    formData.append("comcard.isActive", "true")
    formData.append("comcard.soleUserId", soleUserId || "")
    formData.append("comcard.bucket", "comcards")
    formData.append("comcard.comcardImageName", soleUserId || "")
    formData.append("comcard.length", comcardData.length?.toString() || "5")
    
    if (comcardData.talentNameColor) {
      formData.append("comcard.talentNameColor", comcardData.talentNameColor)
    }
    if (comcardData.pdf) {
      formData.append("comcard.pdf", comcardData.pdf)
    }
    
    // ComCard photos with position tracking
    let photoFileIndex = 0
    comcardData.photoConfig?.forEach((blob, actualPosition) => {
      if (blob instanceof File) {
        // Only upload new/changed photos
        formData.append(
          `photoReplacementList[${photoFileIndex}].position`,
          actualPosition.toString()
        )
        formData.append(`photoReplacementList[${photoFileIndex}].photo`, blob)
        formData.append(
          `photoReplacementList[${photoFileIndex}].photoName`,
          blob.name
        )
        photoFileIndex++
      }
    })

    const response = await fetch(
      `${API_BASE_URL}/talent-info/with-comcard/sole-user/${soleUserId}`,
      {
        method: "PUT",
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error("Failed to update TalentInfo")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error updating TalentInfo:", error)
    throw error
  }
}
```

**HTTP Request Example**:
```http
PUT http://localhost:8080/api/talent-info/with-comcard/sole-user/user_abc123
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...

------WebKitFormBoundary...
Content-Disposition: form-data; name="talentInfo.talentName"

John Doe
------WebKitFormBoundary...
Content-Disposition: form-data; name="talentInfo.gender"

Male
------WebKitFormBoundary...
Content-Disposition: form-data; name="talentInfo.age"

28
------WebKitFormBoundary...
Content-Disposition: form-data; name="talentInfo.height"

175
------WebKitFormBoundary...
Content-Disposition: form-data; name="talentInfo.snapshotHalfBodyImage"; filename="halfbody.jpg"
Content-Type: image/jpeg

[BINARY IMAGE DATA]
------WebKitFormBoundary...
Content-Disposition: form-data; name="photoReplacementList[0].position"

0
------WebKitFormBoundary...
Content-Disposition: form-data; name="photoReplacementList[0].photo"; filename="photo1.jpg"
Content-Type: image/jpeg

[BINARY IMAGE DATA]
------WebKitFormBoundary...--
```

---

## 🔄 BACKEND PROCESSING

### Spring Boot Controller

```java
@RestController
@RequestMapping("/api/talent-info")
public class TalentInfoController {
    
    @Autowired
    private TalentInfoService talentInfoService;
    
    @PutMapping("/with-comcard/sole-user/{soleUserId}")
    public ResponseEntity<TalentInfoWithComcardResponse> updateTalentInfoWithComcard(
        @PathVariable String soleUserId,
        @ModelAttribute UpdateTalentInfoWithComcardRequest request
    ) {
        TalentInfoWithComcardResponse response = 
            talentInfoService.updateTalentInfoWithComcard(soleUserId, request);
        return ResponseEntity.ok(response);
    }
}
```

### Service Layer Processing

```java
@Service
@Transactional
public class TalentInfoService {
    
    @Autowired
    private TalentInfoRepository talentInfoRepository;
    
    @Autowired
    private ComcardRepository comcardRepository;
    
    @Autowired
    private ComcardPhotoRepository comcardPhotoRepository;
    
    @Autowired
    private CloudinaryService cloudinaryService;
    
    @Autowired
    private PdfGeneratorService pdfGeneratorService;
    
    public TalentInfoWithComcardResponse updateTalentInfoWithComcard(
        String soleUserId,
        UpdateTalentInfoWithComcardRequest request
    ) {
        // 1. Find existing talent info
        TalentInfo talentInfo = talentInfoRepository
            .findBySoleUserId(soleUserId)
            .orElseThrow(() -> new NotFoundException("Talent info not found"));
        
        // 2. Update talent info fields
        talentInfo.setTalentName(request.getTalentInfo().getTalentName());
        talentInfo.setGender(request.getTalentInfo().getGender());
        talentInfo.setEyeColor(request.getTalentInfo().getEyeColor());
        talentInfo.setHairColor(request.getTalentInfo().getHairColor());
        talentInfo.setAge(request.getTalentInfo().getAge());
        talentInfo.setHeight(request.getTalentInfo().getHeight());
        talentInfo.setChest(request.getTalentInfo().getChest());
        talentInfo.setWaist(request.getTalentInfo().getWaist());
        talentInfo.setHip(request.getTalentInfo().getHip());
        talentInfo.setShoes(request.getTalentInfo().getShoes());
        talentInfo.setEthnic(request.getTalentInfo().getEthnic());
        talentInfo.setRegion(request.getTalentInfo().getRegion());
        talentInfo.setExperience(request.getTalentInfo().getExperience());
        talentInfo.setUpdatedAt(LocalDateTime.now());
        
        // 3. Upload snapshot images if provided
        if (request.getTalentInfo().getSnapshotHalfBodyImage() != null) {
            String halfBodyUrl = cloudinaryService.uploadFile(
                request.getTalentInfo().getSnapshotHalfBodyImage(),
                "talentinformation",
                soleUserId + "_halfbody"
            );
            talentInfo.setSnapshotHalfBody(halfBodyUrl);
        }
        
        if (request.getTalentInfo().getSnapshotFullBodyImage() != null) {
            String fullBodyUrl = cloudinaryService.uploadFile(
                request.getTalentInfo().getSnapshotFullBodyImage(),
                "talentinformation",
                soleUserId + "_fullbody"
            );
            talentInfo.setSnapshotFullBody(fullBodyUrl);
        }
        
        // 4. Save talent info
        TalentInfo savedTalentInfo = talentInfoRepository.save(talentInfo);
        
        // 5. Update ComCard
        Comcard comcard = comcardRepository
            .findBySoleUserId(soleUserId)
            .orElseGet(() -> new Comcard());
        
        comcard.setConfigId(request.getComcard().getConfigId());
        comcard.setIsActive(request.getComcard().getIsActive());
        comcard.setSoleUserId(soleUserId);
        comcard.setTalentNameColor(request.getComcard().getTalentNameColor());
        comcard.setLength(5);
        comcard.setUpdatedAt(LocalDateTime.now());
        
        // 6. Handle photo replacements
        if (request.getPhotoReplacementList() != null) {
            for (PhotoReplacement replacement : request.getPhotoReplacementList()) {
                // Upload new photo
                String photoUrl = cloudinaryService.uploadFile(
                    replacement.getPhoto(),
                    "comcards",
                    soleUserId + "_photo_" + replacement.getPosition()
                );
                
                // Update or create comcard_photo record
                ComcardPhoto photo = comcardPhotoRepository
                    .findByComcardIdAndDisplayOrder(
                        comcard.getId(), 
                        replacement.getPosition()
                    )
                    .orElseGet(() -> new ComcardPhoto());
                
                photo.setComcardId(comcard.getId());
                photo.setPhotoUrl(photoUrl);
                photo.setDisplayOrder(replacement.getPosition());
                
                comcardPhotoRepository.save(photo);
            }
        }
        
        // 7. Generate ComCard PNG
        String pngUrl = pdfGeneratorService.generateComcardPNG(
            comcard,
            savedTalentInfo
        );
        comcard.setPng(pngUrl);
        
        // 8. Generate ComCard PDF
        if (request.getComcard().getPdf() != null) {
            String pdfUrl = pdfGeneratorService.generateComcardPDF(
                comcard,
                savedTalentInfo
            );
            comcard.setPdf(pdfUrl);
        }
        
        // 9. Save comcard
        Comcard savedComcard = comcardRepository.save(comcard);
        
        // 10. Build response
        return TalentInfoWithComcardResponse.builder()
            .talentInfo(savedTalentInfo)
            .comcard(savedComcard)
            .build();
    }
}
```

**Backend SQL Queries**:
```sql
-- 1. Find talent info
SELECT * FROM talent_info WHERE sole_user_id = 'user_abc123';

-- 2. Update talent info
UPDATE talent_info SET
  talent_name = 'John Doe',
  gender = 'Male',
  eye_color = 'Brown',
  hair_color = 'Black',
  age = 28,
  height = 175,
  chest = 95,
  waist = 75,
  hip = 90,
  shoes = 42,
  ethnic = 'Asian',
  region = 'Southeast Asia',
  experience = '5 years professional acting',
  snapshot_halfbody = 'https://res.cloudinary.com/xyz/...',
  snapshot_fullbody = 'https://res.cloudinary.com/xyz/...',
  updated_at = NOW()
WHERE sole_user_id = 'user_abc123';

-- 3. Find comcard
SELECT * FROM comcard WHERE sole_user_id = 'user_abc123';

-- 4. Update comcard
UPDATE comcard SET
  talent_name_color = 'black',
  png = 'https://res.cloudinary.com/xyz/comcard.png',
  pdf = 'https://res.cloudinary.com/xyz/comcard.pdf',
  updated_at = NOW()
WHERE sole_user_id = 'user_abc123';

-- 5. Update comcard photos (for each changed photo)
UPDATE comcard_photo SET
  photo_url = 'https://res.cloudinary.com/xyz/photo.jpg'
WHERE comcard_id = 123 AND display_order = 0;

INSERT INTO comcard_photo (comcard_id, photo_url, display_order, created_at)
VALUES (123, 'https://res.cloudinary.com/xyz/photo.jpg', 1, NOW());
```

---

## 🎨 EDIT FIELD MODAL SYSTEM

### EditFieldModal Component

**File**: `/src/app/(home)/_components/userProfile/_talentProfileComponents/edit-field-modal.tsx`

**How It Works**:

1. **Display Mode** (Closed):
```
┌─────────────────────────────┐
│  Age               28      │ ← Click to edit
└─────────────────────────────┘
```

2. **Edit Mode** (Modal Open):
```
┌─────────────────────────────┐
│  Edit Age                   │
│  ┌─────────────────────────┐│
│  │  [28]                   ││
│  └─────────────────────────┘│
│  [Cancel] [Save]            │
└─────────────────────────────┘
```

**Implementation**:
```typescript
<Card
  isPressable={isPressable}
  onPress={isPressable ? onOpen : undefined}
  className={`grid grid-cols-2 ${isPressable ? "hover:bg-gray-500" : ""}`}
>
  <div className="col-span-1">
    {label}
    {isRequired ? <span className="text-red-500">*</span> : null}
  </div>
  <div className="col-span-1">
    {hasValue ? fieldValue : "N/A"}
    {unit && <span>{unit}</span>}
  </div>
</Card>

<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
  <ModalContent>
    <ModalHeader>Edit {label}</ModalHeader>
    <ModalBody>
      {type == "text" && (
        <InputField
          fieldname={fieldname}
          label={label}
          validation={validation}
        />
      )}
      
      {type == "number" && (
        <NumberInputField
          fieldname={fieldname}
          label={label}
          minimum={100}
          maximum={250}
        />
      )}
      
      {type == "select" && (
        <DropDownSingleSelect
          fieldname={fieldname}
          label={label}
        />
      )}
    </ModalBody>
    <ModalFooter>
      <Button onPress={handleCancel}>Cancel</Button>
      <Button onPress={onClose}>Save</Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

**Field Types**:
- **text**: Regular input field
- **textArea**: Multi-line input
- **number**: Number input with min/max
- **select**: Dropdown with predefined options
- **selectWithSection**: Dropdown with grouped options

---

## 🖼️ IMAGE UPLOAD SYSTEM

### CropImageInput Component

**File**: `/src/components/image-cropper/crop-image-input.tsx`

**Features**:
- **Upload**: Click to upload image
- **Crop**: Interactive crop tool
- **Aspect Ratio**: Configurable (1/1 for profile, free for snapshots)
- **Shape**: Round (profile pic) or Rectangular (snapshots)
- **Preview**: Real-time preview of cropped image
- **Output**: Base64 string or File object

**How It Works**:

1. **User clicks upload icon**
2. **File picker opens**
3. **User selects image**
4. **Image loaded into cropper**
5. **User adjusts crop area**
6. **Save → Converts to base64/blob**
7. **Stored in Formik values**
8. **On submit → Sent to backend**

**Crop Data Structure**:
```typescript
{
  file: File,
  cropData: {
    x: 100,
    y: 50,
    width: 800,
    height: 800,
    zoom: 1.2,
    naturalWidth: 1920,
    naturalHeight: 1080,
  },
  isVideo: false,
}
```

---

## 🎴 COMCARD SYSTEM

### What is a ComCard?

**ComCard** = Digital Business Card for talent

**Contains**:
- 5 professional photos
- Talent name
- Physical measurements
- Contact information
- Downloadable as PDF

### ComCard Template

**File**: `/src/app/(home)/_components/userProfile/_comcardComponents/comcard-template1.tsx`

**Layout**:
```
┌─────────────────────────────┐
│  Photo 1 │ Photo 2 │ Photo 3│ ← Top row (3 photos)
├──────────┴─────────┴────────┤
│  Photo 4      │  Photo 5    │ ← Bottom row (2 photos)
├─────────────────────────────┤
│  JOHN DOE                   │ ← Talent name
│  Height: 175cm  Age: 28     │
│  Chest: 95  Waist: 75  Hip:90│
└─────────────────────────────┘
```

**Drag & Drop Reordering**:
```typescript
import { DndContext, closestCenter } from "@dnd-kit/core"
import { SortableContext, arrayMove } from "@dnd-kit/sortable"

const handleDragEnd = (event) => {
  const { active, over } = event
  
  if (active.id !== over.id) {
    const oldIndex = items.indexOf(active.id)
    const newIndex = items.indexOf(over.id)
    
    const newOrder = arrayMove(items, oldIndex, newIndex)
    setFieldValue("photoConfig", newOrder)
  }
}
```

### PDF Generation

**Server-Side** (Java):
```java
public String generateComcardPDF(Comcard comcard, TalentInfo talentInfo) {
    // 1. Load ComCard template
    PDDocument document = new PDDocument();
    PDPage page = new PDPage(PDRectangle.A4);
    document.addPage(page);
    
    // 2. Render photos
    for (ComcardPhoto photo : comcard.getPhotos()) {
        addImageToPDF(document, page, photo.getPhotoUrl(), photo.getDisplayOrder());
    }
    
    // 3. Add text (name, measurements)
    addTextToPDF(page, talentInfo.getTalentName(), comcard.getTalentNameColor());
    addTextToPDF(page, "Height: " + talentInfo.getHeight() + "cm");
    addTextToPDF(page, "Chest: " + talentInfo.getChest() + " Waist: " + talentInfo.getWaist());
    
    // 4. Save to file
    String filename = soleUserId + "_comcard.pdf";
    document.save(tempFile);
    
    // 5. Upload to Cloudinary
    String pdfUrl = cloudinaryService.uploadPDF(tempFile, "comcards", filename);
    
    return pdfUrl;
}
```

---

## 🛠️ IMPLEMENTATION CHECKLIST

### Step 1: Database Setup
```sql
- [ ] Create sole_user table
- [ ] Create user_info table
- [ ] Create talent_info table
- [ ] Create comcard table
- [ ] Create comcard_photo table
- [ ] Add foreign key constraints
- [ ] Create indexes on sole_user_id fields
```

### Step 2: Backend API
```java
- [ ] TalentInfoController.java
- [ ] TalentInfoService.java
- [ ] TalentInfoRepository.java
- [ ] ComcardRepository.java
- [ ] ComcardPhotoRepository.java
- [ ] CloudinaryService.java (image upload)
- [ ] PdfGeneratorService.java (ComCard PDF)
- [ ] Endpoint: POST /api/talent-info/with-comcard
- [ ] Endpoint: PUT /api/talent-info/with-comcard/sole-user/{id}
- [ ] Endpoint: GET /api/talent-info/sole-user/{id}
```

### Step 3: Frontend API Functions
```typescript
- [ ] createTalentInfoWithComcard() in talentInfo_api.ts
- [ ] updateTalentInfoWithComcardBySoleUserId() in talentInfo_api.ts
- [ ] getTalentInfoBySoleUserId() in talentInfo_api.ts
- [ ] updateUserInfoBySoleUserId() in userInfo_api.ts
- [ ] updateSoleUserByClerkId() in apiservice.ts
```

### Step 4: Form Components
```typescript
- [ ] UserInfoForm.tsx (profile pic, username, name, bio, categories)
- [ ] TalentProfileForm.tsx (full talent form)
- [ ] TalentProfileInfo.tsx (read-only display)
- [ ] EditFieldModal.tsx (individual field editor)
- [ ] CategoriesCard.tsx (category multi-select)
- [ ] CropImageInput.tsx (image upload with crop)
- [ ] ComcardTemplate1.tsx (ComCard preview)
- [ ] SelectTemplate.tsx (template picker)
```

### Step 5: Validation
```typescript
- [ ] validateUsername() - unique, 3-30 chars
- [ ] validateName() - 2-100 chars
- [ ] validateField() - not empty
- [ ] validateNumberField() - in range
- [ ] validateImageField() - file exists
```

### Step 6: State Management
```typescript
- [ ] Formik for form state
- [ ] React Query mutations for API calls
- [ ] Query invalidation on success
- [ ] Toast notifications for feedback
```

### Step 7: Image Processing
```typescript
- [ ] Implement image cropper
- [ ] Base64 to Blob conversion
- [ ] FormData multipart upload
- [ ] Cloudinary integration
- [ ] Image optimization
```

### Step 8: ComCard System
```typescript
- [ ] Template components (1, 2, 3)
- [ ] Drag & drop photo reordering
- [ ] PDF generation (backend)
- [ ] PNG preview (backend)
- [ ] Download functionality
```

---

## 📝 SUMMARY

### Complete Field List (25 Fields)

**User Profile (5 fields)**:
1. Profile Picture
2. Username
3. Name
4. Bio
5. Categories (up to 5)

**Talent Info (13 fields)**:
6. Talent Name
7. Gender
8. Eye Color
9. Hair Color
10. Age
11. Height (cm)
12. Chest (cm)
13. Waist (cm)
14. Hip (cm)
15. Shoes (EU)
16. Ethnic
17. Region
18. Experience

**Portfolio (2 fields)**:
19. Half-Body Snapshot
20. Full-Body Snapshot

**ComCard (5 fields)**:
21. Template ID
22. 5 Photos (array)
23. Talent Name Color
24. PDF (auto-generated)
25. PNG (auto-generated)

### Technologies Used
- **Form Management**: Formik
- **Validation**: Custom validators + Yup schema
- **Image Upload**: react-easy-crop + Cloudinary
- **File Handling**: FormData (multipart/form-data)
- **State**: React Query mutations
- **UI**: HeroUI (Modal, Card, Button, Input)
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable
- **PDF Generation**: Backend (Java PDF libraries)

### Data Updates THREE Tables
1. **sole_user**: username, talent_level
2. **user_info**: profile_pic, name, bio, category
3. **talent_info**: All 13+ talent fields
4. **comcard**: Template, photos, colors, PDF/PNG
5. **comcard_photo**: Individual photo records

---

**This guide covers EVERYTHING about talent profile editing. Copy and paste to another Cursor for complete understanding.**

**Document Created**: 2025-10-22  
**Version**: 1.0.0 (ULTIMATE TALENT EDITION)  
**Purpose**: Complete technical guide for talent profile creation and editing system

