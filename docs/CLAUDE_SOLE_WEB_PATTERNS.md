# 🎯 Claude's Guide: sole-web to sole-react-native Patterns

> **CRITICAL:** This guide documents the exact patterns from sole-web that must be followed in sole-react-native. Read this BEFORE implementing any new features!

---

## 📐 Architecture Patterns

### **1. Layout Structure with Inner Navigation**

#### **sole-web Pattern:**
```tsx
// layout.tsx
<ManageProjectProvider>
  <div className="flex flex-row">
    {/* LEFT SIDE: Inner Navigation Tabs */}
    <div className="border-r">
      <SideNavInner url={clientConfig.sidebarNavInner} />
    </div>
    
    {/* RIGHT SIDE: Page Content */}
    <div className="flex-1">
      {children}
    </div>
  </div>
</ManageProjectProvider>

// Config
sidebarNavInner: [
  { title: "Manage Projects", href: "/client/projects/manage-projects" },
  { title: "Manage Contracts", href: "/client/projects/manage-contracts" },
]
```

#### **sole-react-native Pattern:**
```tsx
// ✅ CORRECT Implementation
// _layout.tsx
<ManageProjectProvider>
  <Stack>
    <Stack.Screen name="manage-projects" />
    <Stack.Screen name="manage-contracts" />
  </Stack>
</ManageProjectProvider>

// ProjectsNavTabs.tsx - Horizontal tabs at TOP of each page
const tabs = [
  { name: 'Manage Projects', href: '/(protected)/(client)/projects/manage-projects' },
  { name: 'Manage Contracts', href: '/(protected)/(client)/projects/manage-contracts' },
];

<ScrollView horizontal>
  {tabs.map(tab => (
    <TouchableOpacity 
      className={`border-b-2 ${active ? 'border-white' : 'border-transparent'}`}
    >
      <Text>{tab.name}</Text>
    </TouchableOpacity>
  ))}
</ScrollView>
```

**Key Differences:**
- Web: Left sidebar navigation
- Mobile: Top horizontal tabs
- Both: Same navigation items, same purpose

---

## 📄 Pagination Pattern

### **sole-web Pattern:**
```tsx
// Uses React Query pagination
const [currentPage, setCurrentPage] = useState(0);

// API call with page parameter
const searchAPI = `?status=${status}&pageNo=${currentPage}&pageSize=10`;

// Pagination component at top and bottom
<ProjectPagination
  totalPage={totalPages}
  currentProjectPage={currentPage}
  setCurrentProjectPage={setCurrentPage}
  isLoading={isLoadingProjects}
/>
```

#### **sole-react-native Pattern:**
```tsx
// ✅ CORRECT - Same query pattern
const { currentPage, setCurrentPage, totalPages } = useManageProjectContext();

// FlatList with pagination footer
<FlatList
  data={projectsData}
  renderItem={renderProject}
  ListFooterComponent={renderPagination} // ← Pagination at bottom
/>

// Pagination component
const renderPagination = () => (
  <View className="py-4 px-6">
    <View className="flex-row justify-between items-center">
      {/* Previous Button */}
      <TouchableOpacity
        className={`flex-row items-center px-4 py-3 rounded-lg ${
          currentPage === 0 ? 'bg-gray-800/30 opacity-50' : 'bg-blue-500/20 border border-blue-500/50'
        }`}
        onPress={() => setCurrentPage(currentPage - 1)}
        disabled={currentPage === 0}
      >
        <ChevronLeft color={currentPage === 0 ? '#6b7280' : '#3b82f6'} size={20} />
        <Text className={`ml-2 font-semibold ${
          currentPage === 0 ? 'text-gray-500' : 'text-blue-500'
        }`}>Previous</Text>
      </TouchableOpacity>

      {/* Page Indicator */}
      <View className="bg-gray-800/60 px-4 py-3 rounded-lg border border-white/10">
        <Text className="text-white font-semibold">
          {currentPage + 1} / {totalPages}
        </Text>
      </View>

      {/* Next Button */}
      <TouchableOpacity
        className={`flex-row items-center px-4 py-3 rounded-lg ${
          currentPage >= totalPages - 1 ? 'bg-gray-800/30 opacity-50' : 'bg-blue-500/20 border border-blue-500/50'
        }`}
        onPress={() => setCurrentPage(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
      >
        <Text className={`mr-2 font-semibold ${
          currentPage >= totalPages - 1 ? 'text-gray-500' : 'text-blue-500'
        }`}>Next</Text>
        <ChevronRight color={currentPage >= totalPages - 1 ? '#6b7280' : '#3b82f6'} size={20} />
      </TouchableOpacity>
    </View>
  </View>
);
```

**Important:**
- ❌ **NOT** infinite scroll
- ✅ **IS** pagination with Previous/Next buttons
- Auto-scroll to top when page changes
- Page indicator shows "X / Y"

---

## 🎨 Button + Modal Pattern

### **sole-web Pattern:**
```tsx
// ✅ Button and Modal TOGETHER in ONE component
export default function ProjectInfoForm({ method, initValues }) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  
  return (
    <>
      <Button onPress={onOpen}>
        {method === 'POST' ? 'Create New Project' : 'Edit Project'}
      </Button>
      
      <Formik onSubmit={handleSubmit}>
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent>
            {/* Form fields */}
          </ModalContent>
        </Modal>
      </Formik>
    </>
  );
}
```

### **sole-react-native Pattern:**
```tsx
// ✅ CORRECT - Same pattern
export default function ProjectInfoFormPortal({ method, initValues }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <TouchableOpacity 
        className="flex-row items-center justify-center gap-2 py-3 px-4 rounded-lg bg-blue-500"
        onPress={() => setIsOpen(true)}
      >
        <Plus color="#ffffff" size={20} />
        <Text className="text-white text-base font-semibold">
          {method === 'POST' ? 'Create New Project' : 'Edit Project'}
        </Text>
      </TouchableOpacity>
      
      <Modal visible={isOpen} onRequestClose={handleClose}>
        <KeyboardAvoidingView className="flex-1 bg-black/70 justify-end">
          <View className="bg-gray-900 rounded-t-3xl">
            {/* Form fields */}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
```

**Rules:**
- ✅ Button and Modal in SAME file
- ✅ Component name ends with "Modal" or "Button"
- ✅ Handles its own state (isOpen)
- ✅ Props: method, initValues, contractId, etc.

---

## 📊 FlatList vs ScrollView

### **❌ WRONG - Nested Virtualized Lists**
```tsx
// This causes warning!
<ScrollView>
  <Header />
  <FlatList data={items} /> {/* ← Virtualized list inside ScrollView */}
</ScrollView>
```

### **✅ CORRECT - Single FlatList**
```tsx
<FlatList
  data={items}
  renderItem={renderItem}
  ListHeaderComponent={renderHeader}    // ← Header content
  ListFooterComponent={renderFooter}    // ← Footer/pagination
  ListEmptyComponent={renderEmpty}      // ← Loading/error states
/>

const renderHeader = () => (
  <View>
    {/* Navigation tabs */}
    <ProjectsNavTabs />
    
    {/* Page header */}
    <Text className="text-[28px] font-bold text-white">Title</Text>
    
    {/* Filters, search, etc. */}
    <ProjectStatusTabs />
  </View>
);

const renderFooter = () => (
  <View>
    {/* Pagination controls */}
  </View>
);
```

---

## 🎨 NativeWind CSS Pattern

### **✅ ALWAYS Use NativeWind**
```tsx
// ✅ CORRECT
<View className="flex-1 bg-black p-4">
  <Text className="text-white font-bold text-xl">Title</Text>
</View>

// ❌ WRONG - Don't use StyleSheet
import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({...});
<View style={styles.container}>
```

### **Exception: Dynamic Values**
```tsx
// ✅ CORRECT - Use style for dynamic values
<View 
  className="px-2.5 py-1 rounded-xl"
  style={{ backgroundColor: dynamicColor + '33' }}
>
  <Text style={{ color: dynamicColor }}>Text</Text>
</View>
```

---

## 📱 Page Structure Pattern

### **Standard Page Template:**
```tsx
export default function PageName() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const { headerTranslateY, handleScroll } = useScrollHeader();
  
  // Context hooks
  const { data, isLoading, error } = useContext();
  
  // Auto-scroll to top when page changes
  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [currentPage]);
  
  // Render functions
  const renderItem = ({ item }) => (<Card />);
  const renderHeader = () => (<Header />);
  const renderFooter = () => (<Pagination />);
  const renderEmpty = () => (<EmptyState />);
  
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        <CollapsibleHeader title="Title" translateY={headerTranslateY} />
        <FlatList
          ref={flatListRef}
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 72,
            paddingBottom: 20,
            paddingHorizontal: 24,
          }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}
```

---

## 🗂️ Multi-Level Navigation Pattern

### **Navigation Hierarchy:**
```
1. ProjectsNavTabs        ← Top level: Manage Projects / Manage Contracts
   └─ ProjectStatusTabs   ← Second level: Draft / Published / InProgress
       └─ ProjectSearchBar ← Third level: Search by field
```

### **Implementation:**
```tsx
// ✅ CORRECT - Complete navigation hierarchy
const renderHeader = () => (
  <View>
    {/* Level 1: Page Navigation */}
    <ProjectsNavTabs />  {/* Manage Projects / Manage Contracts */}
    
    {/* Page Title */}
    <Text className="text-[28px] font-bold text-white mb-1">Manage Projects</Text>
    
    {/* Action Button */}
    <ProjectInfoFormPortal method="POST" />
    
    {/* Level 2: Status Filter */}
    <ProjectStatusTabs />  {/* Draft / Published / InProgress */}
    
    {/* Level 3: Search */}
    <ProjectSearchBar />  {/* Search by projectName/projectId/username */}
    
    {/* Results */}
    <Text>X projects found {isSearching && '(filtered)'}</Text>
  </View>
);
```

---

## 🎨 Component Patterns Checklist

### **When Creating ANY Component:**

- [ ] Use NativeWind className (NOT StyleSheet)
- [ ] If Button + Modal → Keep them together
- [ ] If List → Use FlatList with ListHeaderComponent
- [ ] If Pagination → Add ListFooterComponent
- [ ] Use ref for FlatList if auto-scroll needed
- [ ] Add loading/error/empty states
- [ ] Follow color system (bg-gray-800/60, text-white, etc.)
- [ ] Use dynamic style prop only for variables
- [ ] Add proper TypeScript types
- [ ] Test on both iOS and Android

---

## 🚨 Critical Mistakes to Avoid

### **1. Missing Navigation Tabs**
```tsx
// ❌ WRONG - No top navigation
<View>
  <Text>Manage Projects</Text>
  <ProjectStatusTabs />
</View>

// ✅ CORRECT - Has top navigation
<View>
  <ProjectsNavTabs />      {/* ← This was missing! */}
  <Text>Manage Projects</Text>
  <ProjectStatusTabs />
</View>
```

### **2. Using Infinite Scroll Instead of Pagination**
```tsx
// ❌ WRONG - Infinite scroll
<FlatList
  data={allProjects}
  onEndReached={loadMore}
/>

// ✅ CORRECT - Pagination
<FlatList
  data={currentPageProjects}
  ListFooterComponent={renderPagination}
/>
```

### **3. Nesting FlatList in ScrollView**
```tsx
// ❌ WRONG - Causes performance warning
<ScrollView>
  <Header />
  <FlatList data={items} />
</ScrollView>

// ✅ CORRECT - Single FlatList
<FlatList
  data={items}
  ListHeaderComponent={<Header />}
/>
```

### **4. Using StyleSheet Instead of NativeWind**
```tsx
// ❌ WRONG
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' }
});
<View style={styles.container} />

// ✅ CORRECT
<View className="flex-1 bg-black" />
```

### **5. Missing Search Component**
```tsx
// ❌ WRONG - No search
<View>
  <ProjectStatusTabs />
  <Text>Results</Text>
</View>

// ✅ CORRECT - Has search
<View>
  <ProjectStatusTabs />
  <ProjectSearchBar />  {/* ← Search was missing! */}
  <Text>Results {isSearching && '(filtered)'}</Text>
</View>
```

---

## 🔍 Search Pattern

### **sole-web SearchProject Component:**
```tsx
<SearchProject
  soleUserId={soleUserId}
  currentProjectPage={currentPage}
  pjStatus={projectStatus}
  setSearchAPI={setSearchAPI}
  setIsSearching={setIsSearching}
  searchInputValue={searchQuery}
  setSearchInputValue={setSearchQuery}
  searchUrl={searchAPI}
/>
```

**Features:**
- Dropdown to select search field (projectName, projectId, username)
- Search input with clear button
- Search button (enter key or button click)
- Updates searchAPI with encoded params
- Shows "Clear All" when searching

### **sole-react-native ProjectSearchBar:**
```tsx
// ✅ CORRECT Implementation
export default function ProjectSearchBar() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedSearchBy, setSelectedSearchBy] = useState('projectName');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const handleSearch = () => {
    if (!searchValue.trim()) {
      // Reset to default
      setSearchAPI(`?status=${projectStatus}&pageNo=${currentPage}&pageSize=10`);
      setIsSearching(false);
    } else {
      const encoded = encodeURIComponent(searchValue);
      let searchParam = '';
      
      switch (selectedSearchBy) {
        case 'projectName':
          searchParam = `&projectName=${encoded}`;
          break;
        case 'projectId':
          searchParam = `&projectId=${encoded}`;
          break;
        case 'username':
          searchParam = `&username=${encoded}`;
          break;
      }
      
      setSearchAPI(`?status=${projectStatus}&pageNo=0${searchParam}&pageSize=10`);
      setIsSearching(true);
    }
  };
  
  return (
    <View className="mb-4">
      <View className="flex-row items-stretch rounded-lg overflow-hidden">
        {/* Dropdown + Input + Button */}
      </View>
      {showDropdown && <DropdownMenu />}
    </View>
  );
}
```

---

## 📋 Implementation Checklist

### **Before Starting ANY Feature:**

1. [ ] Read sole-web implementation carefully
2. [ ] Check if there's a layout with SideNavInner
3. [ ] Check if there's pagination (not infinite scroll)
4. [ ] Identify all navigation levels
5. [ ] Note all button+modal patterns
6. [ ] Check context structure
7. [ ] Review API patterns

### **During Implementation:**

1. [ ] Create context if needed
2. [ ] Create navigation tabs component
3. [ ] Use FlatList (not ScrollView)
4. [ ] Add ListHeaderComponent
5. [ ] Add ListFooterComponent for pagination
6. [ ] Use NativeWind (not StyleSheet)
7. [ ] Keep buttons with modals
8. [ ] Add proper loading/error states

### **After Implementation:**

1. [ ] Test pagination works
2. [ ] Test navigation tabs work
3. [ ] Verify no nested list warnings
4. [ ] Check all modals open correctly
5. [ ] Test on both platforms
6. [ ] Verify API calls match sole-web
7. [ ] Check linter errors

---

## 🔍 Quick Verification Questions

Before submitting code, ask:

1. **Is there inner navigation?** → Add ProjectsNavTabs
2. **Is it paginated?** → Add ListFooterComponent with pagination
3. **Are there buttons with forms?** → Keep in same component
4. **Is there a list?** → Use FlatList, not ScrollView
5. **Is there styling?** → Use NativeWind, not StyleSheet

---

## 📚 sole-web Structure Reference

### **Typical sole-web Page:**
```
layout.tsx (Provider + SideNavInner)
  ├── manage-projects/page.tsx
  │   ├── ProjectInfoForm (button + modal)
  │   ├── ProjectStatusTab (status filter)
  │   ├── SearchProject
  │   ├── ProjectPagination (top)
  │   ├── ProjectTable
  │   └── ProjectPagination (bottom)
  │
  └── manage-contracts/page.tsx
      ├── SearchContract
      ├── Pagination (top)
      ├── ClientContractTable
      └── Pagination (bottom)
```

### **Converted React Native Structure:**
```
_layout.tsx (Provider only)
  ├── manage-projects.tsx
  │   └── FlatList
  │       ├── ListHeaderComponent:
  │       │   ├── ProjectsNavTabs (Manage Projects / Manage Contracts)
  │       │   ├── Title
  │       │   ├── ProjectInfoFormPortal (button + modal)
  │       │   ├── ProjectStatusTabs (Draft / Published / InProgress)
  │       │   └── Results count
  │       ├── renderItem: Project cards
  │       ├── ListFooterComponent: Pagination
  │       └── ListEmptyComponent: Loading/Error/Empty
  │
  └── manage-contracts.tsx
      └── FlatList
          ├── ListHeaderComponent:
          │   ├── ProjectsNavTabs
          │   ├── Title
          │   ├── SearchBar
          │   ├── Status filters
          │   └── Results count
          ├── renderItem: Contract cards
          └── ListEmptyComponent: Loading/Error/Empty
```

---

## 🎯 Key Takeaways

### **Always Remember:**

1. **Navigation Tabs** - ProjectsNavTabs goes at the top of EVERY main page
2. **Pagination** - Previous/Next buttons, NOT infinite scroll
3. **FlatList Structure** - Header/Footer/Empty components
4. **NativeWind** - No StyleSheet, use className
5. **Button + Modal** - Always together in one component
6. **Auto-scroll** - Scroll to top when page changes

### **Pattern Priority:**
```
1. Read sole-web carefully
2. Identify navigation structure
3. Use FlatList (not ScrollView)
4. Add navigation tabs
5. Add pagination (not infinite scroll)
6. Use NativeWind
7. Test thoroughly
```

---

## 📖 Example: Correct Implementation Flow

```tsx
// Step 1: Check sole-web layout
// Found: SideNavInner with ["Manage Projects", "Manage Contracts"]

// Step 2: Create navigation component
// Created: ProjectsNavTabs.tsx

// Step 3: Create page with FlatList
export default function ManageProjectsPage() {
  const flatListRef = useRef<FlatList>(null);
  
  // Step 4: Auto-scroll on page change
  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [currentPage]);
  
  // Step 5: Render functions
  const renderHeader = () => (
    <View>
      <ProjectsNavTabs />           {/* ← Navigation */}
      <Text>Manage Projects</Text>
      <ProjectInfoFormPortal />      {/* ← Button + Modal */}
      <ProjectStatusTabs />         {/* ← Filters */}
    </View>
  );
  
  const renderFooter = () => (
    <View>{/* Pagination */}</View>
  );
  
  // Step 6: Single FlatList
  return (
    <FlatList
      ref={flatListRef}
      data={data}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
    />
  );
}
```

---

## ✅ Final Verification

Before marking any feature complete:

1. ✅ All pages have ProjectsNavTabs at top
2. ✅ Pagination uses Previous/Next (not infinite scroll)
3. ✅ No nested FlatList warnings
4. ✅ All components use NativeWind
5. ✅ Button+Modal components are together
6. ✅ Auto-scroll to top on page change
7. ✅ No linter errors
8. ✅ Tested on device/simulator

---

**Last Updated:** 2025-11-12  
**Purpose:** Ensure exact sole-web patterns in React Native  
**For:** AI Assistant (Claude) reference

---

## 📝 Notes for Claude

When user says:
- "Follow sole-web pattern" → Check THIS guide first
- "Add navigation" → Check if ProjectsNavTabs needed
- "Add pagination" → Use Previous/Next buttons, NOT infinite scroll
- "Use NativeWind" → NO StyleSheet allowed
- "Make a component" → Check if it's button+modal pattern

**Always read sole-web code carefully before implementing!**

