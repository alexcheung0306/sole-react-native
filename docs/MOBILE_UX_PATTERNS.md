# 📱 Mobile UX Patterns for sole-react-native

> **Key Principle:** Mobile-first design - use modals/bottom sheets instead of dropdowns for better UX

---

## 🎯 Search & Filter Pattern (Mobile-Optimized)

### **Web vs Mobile**

| Feature | Web (sole-web) | Mobile (sole-react-native) |
|---------|----------------|----------------------------|
| Filter UI | Dropdown menu | Bottom sheet modal |
| Selection | Click | Touch |
| Multiple selections | In dropdown | In modal |
| Clear all | Menu item | Button in modal |
| Apply filters | Auto | Apply button |

---

## 📋 Standard Search Bar Pattern

### **Visual Structure:**

```
┌──────────────────────────────────────────────┐
│ [🔍] [      Search input...    X ] [🔍]   │
│  ↑                                    ↑      │
│  Filter                            Search    │
│  Button                            Button    │
└──────────────────────────────────────────────┘
```

### **Code Pattern:**

```tsx
<View className="flex-row items-stretch gap-2">
  {/* Filter Button with Badge */}
  <TouchableOpacity
    className="bg-gray-800/60 border border-white/10 px-4 py-3 rounded-lg justify-center items-center"
    onPress={() => setShowFilterModal(true)}
  >
    <View className="relative">
      <Filter color="#9ca3af" size={20} />
      {hasActiveFilters && (
        <View className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
      )}
    </View>
  </TouchableOpacity>

  {/* Search Input */}
  <View className="flex-1 flex-row items-center bg-gray-800/60 rounded-lg border border-white/10 px-3">
    <Search color="#9ca3af" size={18} />
    <TextInput
      className="flex-1 text-white text-base ml-2"
      placeholder="Search..."
      onSubmitEditing={handleSearch}
      returnKeyType="search"
    />
    {value && (
      <TouchableOpacity onPress={handleClear}>
        <X color="#9ca3af" size={18} />
      </TouchableOpacity>
    )}
  </View>

  {/* Search Button */}
  <TouchableOpacity 
    className="bg-blue-500 px-4 rounded-lg justify-center items-center" 
    onPress={handleSearch}
  >
    <Search color="#ffffff" size={20} />
  </TouchableOpacity>
</View>
```

---

## 🎨 Filter Modal Pattern

### **Structure:**

```tsx
<Modal
  visible={showFilterModal}
  animationType="slide"
  transparent={true}
>
  <View className="flex-1 bg-black/70 justify-end">
    <View className="bg-gray-900 rounded-t-3xl max-h-[80%] border-t border-white/10">
      {/* Header */}
      <View className="flex-row justify-between items-center p-5 border-b border-white/10">
        <Text className="text-xl font-bold text-white">Filters</Text>
        <TouchableOpacity onPress={closeModal}>
          <X color="#ffffff" size={24} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView className="p-5">
        {/* Filter sections */}
      </ScrollView>

      {/* Footer */}
      <View className="flex-row gap-3 p-5 border-t border-white/10">
        <TouchableOpacity className="flex-1 py-3.5 rounded-lg bg-gray-800/60">
          <Text className="text-white font-semibold">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 py-3.5 rounded-lg bg-blue-500">
          <Text className="text-white font-semibold">Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
```

---

## 🎨 Filter Section Pattern

### **Single-Select Options:**

```tsx
<Text className="text-gray-400 text-xs font-semibold mb-3">SEARCH BY</Text>
<View className="gap-2 mb-6">
  {options.map((option) => (
    <TouchableOpacity
      key={option.id}
      className={`flex-row items-center justify-between p-4 rounded-lg border ${
        selected === option.id
          ? 'bg-blue-500/20 border-blue-500'
          : 'bg-gray-800/60 border-white/10'
      }`}
      onPress={() => setSelected(option.id)}
    >
      <Text className={`text-sm font-semibold ${
        selected === option.id ? 'text-blue-500' : 'text-white'
      }`}>
        {option.label}
      </Text>
      {selected === option.id && (
        <Text className="text-blue-500 text-lg font-bold">✓</Text>
      )}
    </TouchableOpacity>
  ))}
</View>
```

### **Multi-Select Options (with colors):**

```tsx
<Text className="text-gray-400 text-xs font-semibold mb-3">STATUS FILTER</Text>

{/* Select All */}
<TouchableOpacity
  className="flex-row items-center justify-between p-4 rounded-lg bg-gray-800/60 border border-white/10 mb-2"
  onPress={handleSelectAll}
>
  <Text className="text-white text-sm font-semibold">
    {allSelected ? 'Deselect All' : 'Select All'}
  </Text>
  {allSelected && <Text className="text-green-500 text-lg font-bold">✓</Text>}
</TouchableOpacity>

{/* Options with Status Colors */}
<View className="gap-2 mb-6">
  {statusOptions.map((option) => (
    <TouchableOpacity
      key={option.id}
      className={`flex-row items-center justify-between p-4 rounded-lg border ${
        isSelected(option.id) ? 'border-white/20' : 'bg-gray-800/60 border-white/10'
      }`}
      style={{
        backgroundColor: isSelected(option.id) ? option.color + '20' : undefined,
      }}
      onPress={() => toggleStatus(option.id)}
    >
      <Text
        className="text-sm font-semibold"
        style={{ color: isSelected(option.id) ? option.color : '#ffffff' }}
      >
        {option.label}
      </Text>
      {isSelected(option.id) && (
        <Text className="text-lg font-bold" style={{ color: option.color }}>✓</Text>
      )}
    </TouchableOpacity>
  ))}
</View>
```

---

## 🎨 Filter Badge Pattern

### **Show Active Filters:**

```tsx
{/* Badge on Filter Button */}
<View className="relative">
  <Filter color="#9ca3af" size={20} />
  {hasActiveFilters && (
    <View className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
  )}
</View>
```

### **Filter Chips Below Search Bar:**

```tsx
{(hasSearchBy || hasStatuses) && (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
    <View className="flex-row gap-2">
      {/* Search By Chip */}
      {searchBy && (
        <View className="flex-row items-center bg-blue-500/20 border border-blue-500 rounded-full px-3 py-1.5 gap-2">
          <Text className="text-blue-500 text-xs font-semibold">
            Search: {searchBy}
          </Text>
          <TouchableOpacity onPress={removeSearchByChip}>
            <X color="#3b82f6" size={14} />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Status Chips */}
      {selectedStatuses.map((status) => (
        <View
          key={status}
          className="flex-row items-center rounded-full px-3 py-1.5 gap-2 border"
          style={{
            backgroundColor: statusColor + '20',
            borderColor: statusColor,
          }}
        >
          <Text className="text-xs font-semibold" style={{ color: statusColor }}>
            {status}
          </Text>
          <TouchableOpacity onPress={() => removeStatus(status)}>
            <X color={statusColor} size={14} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  </ScrollView>
)}
```

---

## ✨ Key Benefits of Modal Pattern

### **1. Better Touch Targets**
```tsx
// ❌ Dropdown - Small touch areas
<Dropdown>
  <DropdownItem>Option</DropdownItem>
</Dropdown>

// ✅ Modal - Large, easy to tap
<TouchableOpacity className="p-4 rounded-lg">
  <Text className="text-sm">Option</Text>
</TouchableOpacity>
```

### **2. More Screen Real Estate**
- Dropdowns: Limited by available space
- Modals: Full screen height (up to 80-85%)
- Better for many options

### **3. Clear Actions**
- Cancel button to dismiss
- Apply button to confirm
- No accidental selections

### **4. Better Visual Feedback**
- Selected items highlighted
- Checkmarks for confirmation
- Color coding for statuses
- Badge on filter button

---

## 📱 Mobile-Specific Features

### **1. Bottom Sheet Animation**
```tsx
<Modal animationType="slide">  {/* Slides up from bottom */}
  <View className="flex-1 justify-end">  {/* Anchored to bottom */}
    <View className="rounded-t-3xl">  {/* Rounded top corners */}
```

### **2. Safe Area Handling**
```tsx
maxHeight: '80%'  // Leaves space for status bar
border-t border-white/10  // Visual separation
```

### **3. Scrollable Content**
```tsx
<ScrollView className="p-5" showsVerticalScrollIndicator={false}>
  {/* Many filter options */}
</ScrollView>
```

### **4. Visual Indicators**
```tsx
{/* Badge on button */}
<View className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />

{/* Filter chips */}
<View className="flex-row gap-2">
  {activeFilters.map(filter => <Chip />)}
</View>
```

---

## 🎨 Component Anatomy

### **ProjectSearchBar** (Simple)

```
┌─────────────────────────────────────────────┐
│ [🔍] [Search by Project Name...  X] [🔍]  │
└─────────────────────────────────────────────┘
         ↓ Tap filter button
┌─────────────────────────────────────────────┐
│ MODAL: Search Filters                       │
│ ─────────────────────────────────           │
│ SEARCH BY                                    │
│ [ ] Project Name                             │
│ [✓] Project ID                               │
│ [ ] Publisher Username                       │
│ ─────────────────────────────────           │
│ [Cancel] [Apply]                             │
└─────────────────────────────────────────────┘
```

### **ContractSearchBar** (Advanced)

```
┌─────────────────────────────────────────────┐
│ [🔍°] [Search by contract...     X] [🔍]   │
│  ↑                                           │
│  Badge (filters active)                     │
└─────────────────────────────────────────────┘
│ [Search: projectName X] [Pending X]         │ ← Filter chips
└─────────────────────────────────────────────┘
         ↓ Tap filter button
┌─────────────────────────────────────────────┐
│ MODAL: Search & Filter                      │
│ ─────────────────────────────────           │
│ SEARCH BY                                    │
│ [✓] Contract Id                              │
│ [ ] Project Id                               │
│ [ ] Project Name                             │
│ [ ] Role Id                                  │
│ [ ] Role Title                               │
│ [ ] Username                                 │
│ ─────────────────────────────────           │
│ STATUS FILTER                                │
│ [ ] Select All Statuses                      │
│ [✓] Pending (orange)                         │
│ [✓] Activated (green)                        │
│ [ ] Cancelled (red)                          │
│ [ ] Completed (green)                        │
│ [ ] Paid (purple)                            │
│ [ ] Payment Due (yellow)                     │
│ ─────────────────────────────────           │
│ [Clear All Filters]                          │
│ ─────────────────────────────────           │
│ [Cancel] [Apply]                             │
└─────────────────────────────────────────────┘
```

---

## ⚖️ When to Use What

### **Use Dropdown (Web):**
- Desktop/laptop screens
- Mouse interaction
- Limited filter options (< 5)
- Quick selection

### **Use Modal (Mobile):**
- Touch screens
- Mobile devices
- Many filter options (> 5)
- Multiple selections needed
- Need clear Apply/Cancel actions

---

## 🎨 Implementation Checklist

### **For ANY Search Component on Mobile:**

- [ ] Filter button with badge indicator
- [ ] Search input with clear (X) button
- [ ] Search button or Enter key support
- [ ] Modal for filters (NOT dropdown)
- [ ] Scrollable modal content
- [ ] Cancel/Apply buttons in modal footer
- [ ] Show selected filters as removable chips
- [ ] Color coding for status filters
- [ ] Clear all functionality
- [ ] Badge shows when filters active

---

## 🎯 Complete Implementation Example

```tsx
export default function MobileSearchBar() {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedField, setSelectedField] = useState('name');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  return (
    <View>
      {/* Search Bar */}
      <View className="flex-row items-stretch gap-2">
        <TouchableOpacity 
          className="bg-gray-800/60 px-4 py-3 rounded-lg"
          onPress={() => setShowFilterModal(true)}
        >
          <View className="relative">
            <Filter size={20} />
            {hasFilters && <Badge />}
          </View>
        </TouchableOpacity>

        <View className="flex-1 flex-row bg-gray-800/60 rounded-lg px-3">
          <Search size={18} />
          <TextInput className="flex-1 ml-2" />
          {searchValue && <X onPress={clear} />}
        </View>

        <TouchableOpacity className="bg-blue-500 px-4 rounded-lg">
          <Search color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal>
        {activeFilters.map(filter => <Chip />)}
      </ScrollView>

      {/* Filter Modal */}
      <Modal visible={showFilterModal}>
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-gray-900 rounded-t-3xl max-h-[80%]">
            {/* Header */}
            <View className="flex-row justify-between p-5 border-b border-white/10">
              <Text className="text-xl font-bold text-white">Filters</Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Filters */}
            <ScrollView className="p-5">
              {/* Section 1: Search By */}
              <FilterSection
                title="SEARCH BY"
                options={searchOptions}
                selected={selectedField}
                onSelect={setSelectedField}
                singleSelect={true}
              />

              {/* Section 2: Status Filter (if applicable) */}
              <FilterSection
                title="STATUS FILTER"
                options={statusOptions}
                selected={selectedStatuses}
                onSelect={toggleStatus}
                multiSelect={true}
                withColors={true}
              />

              {/* Clear All */}
              {hasFilters && <ClearAllButton />}
            </ScrollView>

            {/* Footer */}
            <View className="flex-row gap-3 p-5 border-t border-white/10">
              <TouchableOpacity 
                className="flex-1 py-3.5 rounded-lg bg-gray-800/60"
                onPress={closeModal}
              >
                <Text className="text-white font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 py-3.5 rounded-lg bg-blue-500"
                onPress={applyFilters}
              >
                <Text className="text-white font-semibold text-center">Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
```

---

## 🎨 Visual Design Details

### **Colors:**
- Background: `bg-gray-900` (modal), `bg-gray-800/60` (buttons)
- Borders: `border-white/10` (default), `border-blue-500` (active)
- Text: `text-white` (primary), `text-gray-400` (labels)
- Active: `bg-blue-500/20` with `border-blue-500`
- Status colors: Dynamic based on status type

### **Spacing:**
- Modal padding: `p-5` (20px)
- Option padding: `p-4` (16px)
- Gap between options: `gap-2` (8px)
- Section margin: `mb-6` (24px)

### **Borders:**
- Modal: `border-t border-white/10`
- Sections: `border-b border-white/10`
- Options: `border border-white/10`

### **Radius:**
- Modal: `rounded-t-3xl` (top only)
- Buttons: `rounded-lg`
- Chips: `rounded-full`

---

## 🚀 User Experience Flow

### **Opening Filters:**
1. User taps filter button (🔍)
2. Modal slides up from bottom
3. User sees all filter options
4. Options have large touch targets

### **Selecting Filters:**
1. Tap to select/deselect
2. Visual feedback (checkmark + color)
3. Can select multiple items
4. Changes not applied yet

### **Applying Filters:**
1. Tap "Apply" button
2. Modal closes with slide animation
3. Search executes
4. Filter chips appear below search
5. Badge appears on filter button

### **Clearing Filters:**
1. Tap "X" on individual chips, OR
2. Tap "Clear All" in modal, OR
3. Clear search input (auto-clears)

---

## ❌ Don't Use Dropdowns on Mobile

### **Why Not:**
- ❌ Small touch targets
- ❌ Limited screen space
- ❌ Hard to see all options
- ❌ Awkward scrolling
- ❌ Easy to mis-tap
- ❌ Poor accessibility

### **Use Modals Instead:**
- ✅ Large touch targets (p-4 = 16px padding)
- ✅ Full screen height available
- ✅ Easy scrolling
- ✅ Clear Cancel/Apply actions
- ✅ Better visual feedback
- ✅ Familiar mobile pattern

---

## 📋 Quick Checklist

Before implementing any search/filter component on mobile:

- [ ] Use Modal (NOT dropdown)
- [ ] Filter button with badge indicator
- [ ] Search input with clear button
- [ ] Enter key triggers search
- [ ] Modal slides from bottom
- [ ] Rounded top corners (rounded-t-3xl)
- [ ] Max height 80-85%
- [ ] Scrollable content
- [ ] Large touch targets (min p-4)
- [ ] Cancel/Apply buttons in footer
- [ ] Show selected filters as chips
- [ ] Clear all functionality
- [ ] Visual feedback on selection

---

## 🎓 Remember

> "On mobile, always prefer modals over dropdowns for complex filters. Modals provide better UX with larger touch targets, clearer actions, and familiar mobile patterns."

---

**Last Updated:** 2025-11-12  
**For:** AI Assistant (Claude)  
**Purpose:** Ensure mobile-first UX patterns

