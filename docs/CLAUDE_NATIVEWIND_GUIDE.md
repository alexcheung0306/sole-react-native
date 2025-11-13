# 🎨 Claude's NativeWind Pattern Guide for sole-react-native

> **IMPORTANT:** This guide is for AI Assistant (Claude) to remember the correct patterns when working on sole-react-native projects. Always follow these patterns!

---

## 📋 Table of Contents
1. [Core Principles](#core-principles)
2. [NativeWind vs StyleSheet](#nativewind-vs-stylesheet)
3. [Common Patterns](#common-patterns)
4. [Component Structure](#component-structure)
5. [Color System](#color-system)
6. [Spacing & Sizing](#spacing--sizing)
7. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
8. [Quick Reference](#quick-reference)

---

## 🎯 Core Principles

### **ALWAYS Use NativeWind for New Components**
```tsx
// ✅ CORRECT - Use NativeWind className
<View className="flex-1 bg-black p-4">
  <Text className="text-white font-bold">Hello</Text>
</View>

// ❌ WRONG - Don't use StyleSheet
<View style={styles.container}>
  <Text style={styles.text}>Hello</Text>
</View>
const styles = StyleSheet.create({...})
```

### **Exception: When Dynamic Styles are Needed**
```tsx
// ✅ CORRECT - Use inline style for dynamic values
<View 
  className="px-2.5 py-1 rounded-xl"
  style={{ backgroundColor: statusColor + '33' }}
>
  <Text style={{ color: statusColor }}>Status</Text>
</View>
```

---

## 🆚 NativeWind vs StyleSheet Conversion

### **Layout & Flexbox**
| StyleSheet | NativeWind | Notes |
|------------|-----------|-------|
| `flex: 1` | `flex-1` | Flex grow |
| `flexDirection: 'row'` | `flex-row` | Horizontal layout |
| `justifyContent: 'center'` | `justify-center` | Center main axis |
| `alignItems: 'center'` | `items-center` | Center cross axis |
| `alignItems: 'flex-end'` | `items-end` | Align to end |
| `gap: 8` | `gap-2` | 8px gap (Tailwind spacing) |

### **Spacing**
| StyleSheet | NativeWind | Pixels |
|------------|-----------|--------|
| `padding: 4` | `p-1` | 4px |
| `padding: 8` | `p-2` | 8px |
| `padding: 12` | `p-3` | 12px |
| `padding: 16` | `p-4` | 16px |
| `padding: 20` | `p-5` | 20px |
| `paddingVertical: 12` | `py-3` | 12px top/bottom |
| `paddingHorizontal: 16` | `px-4` | 16px left/right |
| `margin: 16` | `m-4` | 16px |
| `marginBottom: 12` | `mb-3` | 12px |

### **Colors**
| StyleSheet | NativeWind | Hex Value |
|------------|-----------|-----------|
| `backgroundColor: '#0a0a0a'` | `bg-black` | #000000 |
| `backgroundColor: 'rgba(31, 41, 55, 0.6)'` | `bg-gray-800/60` | With opacity |
| `color: '#ffffff'` | `text-white` | #ffffff |
| `color: '#3b82f6'` | `text-blue-500` | #3b82f6 |
| `color: '#ef4444'` | `text-red-500` | #ef4444 |
| `color: '#9ca3af'` | `text-gray-400` | #9ca3af |

### **Borders & Radius**
| StyleSheet | NativeWind |
|------------|-----------|
| `borderRadius: 8` | `rounded-lg` |
| `borderRadius: 12` | `rounded-xl` |
| `borderRadius: 16` | `rounded-2xl` |
| `borderRadius: 999` | `rounded-full` |
| `borderWidth: 1` | `border` |
| `borderColor: 'rgba(255, 255, 255, 0.1)'` | `border-white/10` |

### **Typography**
| StyleSheet | NativeWind |
|------------|-----------|
| `fontSize: 12` | `text-xs` |
| `fontSize: 14` | `text-sm` |
| `fontSize: 16` | `text-base` |
| `fontSize: 18` | `text-lg` |
| `fontSize: 20` | `text-xl` |
| `fontSize: 28` | `text-[28px]` |
| `fontWeight: '600'` | `font-semibold` |
| `fontWeight: '700'` | `font-bold` |

---

## 🏗️ Common Patterns

### **1. Button Pattern**
```tsx
// ✅ CORRECT
<TouchableOpacity
  className="flex-row items-center justify-center gap-2 py-3 px-4 rounded-lg bg-blue-500"
  onPress={handlePress}
>
  <Icon color="#ffffff" size={20} />
  <Text className="text-white text-base font-semibold">
    Button Text
  </Text>
</TouchableOpacity>
```

### **2. Card Pattern**
```tsx
// ✅ CORRECT
<View className="bg-gray-800/60 rounded-xl p-4 border border-white/10 mb-3">
  <Text className="text-white font-semibold mb-2">Card Title</Text>
  <Text className="text-gray-400 text-sm">Card content here</Text>
</View>
```

### **3. Input Field Pattern**
```tsx
// ✅ CORRECT
<View className="mb-5">
  <Text className="text-sm font-semibold text-white mb-2">
    Label <Text className="text-red-500">*</Text>
  </Text>
  <TextInput
    className="bg-gray-800/60 border border-white/10 rounded-lg p-3 text-white text-base"
    placeholder="Enter value"
    placeholderTextColor="#6b7280"
  />
</View>
```

### **4. Modal Pattern**
```tsx
// ✅ CORRECT
<Modal visible={isOpen} animationType="slide" transparent={true}>
  <KeyboardAvoidingView 
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    className="flex-1 bg-black/70 justify-end"
  >
    <View className="bg-gray-900 rounded-t-3xl max-h-[90%] border-t border-white/10">
      {/* Header */}
      <View className="flex-row justify-between items-center p-5 border-b border-white/10">
        <Text className="text-xl font-bold text-white">Modal Title</Text>
        <TouchableOpacity onPress={onClose} className="p-1">
          <X color="#ffffff" size={24} />
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      <ScrollView className="p-5">
        {/* Form fields */}
      </ScrollView>
      
      {/* Footer */}
      <View className="flex-row gap-3 p-5 border-t border-white/10">
        <TouchableOpacity className="flex-1 py-3.5 rounded-lg items-center bg-red-500/20 border border-red-500">
          <Text className="text-red-500 text-base font-semibold">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 py-3.5 rounded-lg items-center bg-blue-500">
          <Text className="text-white text-base font-semibold">Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  </KeyboardAvoidingView>
</Modal>
```

### **5. Status Badge Pattern**
```tsx
// ✅ CORRECT
<View 
  className="px-2.5 py-1 rounded-xl"
  style={{ backgroundColor: statusColor + '33' }}
>
  <Text 
    className="text-[11px] font-semibold" 
    style={{ color: statusColor }}
  >
    {status}
  </Text>
</View>
```

### **6. Toggle Switch Pattern**
```tsx
// ✅ CORRECT
<TouchableOpacity
  className="flex-row justify-between items-center mb-5"
  onPress={() => setIsEnabled(!isEnabled)}
>
  <Text className="text-sm font-semibold text-white">Enable Feature</Text>
  <View className={`w-[52px] h-7 rounded-full p-0.5 justify-center ${
    isEnabled ? 'bg-blue-500' : 'bg-gray-700'
  }`}>
    <View className={`w-6 h-6 rounded-full bg-white ${
      isEnabled ? 'self-end' : 'self-start'
    }`} />
  </View>
</TouchableOpacity>
```

### **7. Pagination Pattern**
```tsx
// ✅ CORRECT
<View className="py-4 px-6">
  <View className="flex-row justify-between items-center">
    {/* Previous Button */}
    <TouchableOpacity
      className={`flex-row items-center px-4 py-3 rounded-lg ${
        currentPage === 0
          ? 'bg-gray-800/30 opacity-50'
          : 'bg-blue-500/20 border border-blue-500/50'
      }`}
      disabled={currentPage === 0}
    >
      <ChevronLeft color={currentPage === 0 ? '#6b7280' : '#3b82f6'} size={20} />
      <Text className={`ml-2 font-semibold ${
        currentPage === 0 ? 'text-gray-500' : 'text-blue-500'
      }`}>
        Previous
      </Text>
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
        currentPage >= totalPages - 1
          ? 'bg-gray-800/30 opacity-50'
          : 'bg-blue-500/20 border border-blue-500/50'
      }`}
      disabled={currentPage >= totalPages - 1}
    >
      <Text className={`mr-2 font-semibold ${
        currentPage >= totalPages - 1 ? 'text-gray-500' : 'text-blue-500'
      }`}>
        Next
      </Text>
      <ChevronRight color={currentPage >= totalPages - 1 ? '#6b7280' : '#3b82f6'} size={20} />
    </TouchableOpacity>
  </View>
</View>
```

---

## 🎨 Color System

### **Background Colors**
```tsx
// Dark theme backgrounds
className="bg-black"           // #000000 - Main background
className="bg-gray-900"        // #111827 - Containers
className="bg-gray-800/60"     // rgba(31, 41, 55, 0.6) - Cards
className="bg-gray-700"        // #374151 - Inputs

// Accent backgrounds
className="bg-blue-500"        // #3b82f6 - Primary buttons
className="bg-blue-500/20"     // rgba(59, 130, 246, 0.2) - Active tabs
className="bg-red-500/20"      // rgba(239, 68, 68, 0.2) - Danger buttons
className="bg-purple-600"      // #9333ea - Edit buttons
```

### **Text Colors**
```tsx
className="text-white"         // #ffffff - Primary text
className="text-gray-300"      // #d1d5db - Secondary text
className="text-gray-400"      // #9ca3af - Tertiary text
className="text-gray-500"      // #6b7280 - Disabled text
className="text-blue-500"      // #3b82f6 - Primary actions
className="text-red-500"       // #ef4444 - Errors/danger
className="text-amber-500"     // #f59e0b - Warnings
className="text-green-500"     // #10b981 - Success
```

### **Border Colors**
```tsx
className="border-white/10"    // rgba(255, 255, 255, 0.1) - Subtle
className="border-blue-500"    // #3b82f6 - Active/primary
className="border-red-500"     // #ef4444 - Danger
className="border-blue-500/50" // rgba(59, 130, 246, 0.5) - Medium emphasis
```

---

## 📏 Spacing & Sizing

### **Common Spacing Values**
```tsx
// Padding/Margin
p-1  = 4px
p-2  = 8px
p-3  = 12px
p-4  = 16px
p-5  = 20px
p-6  = 24px

// Gap
gap-1 = 4px
gap-2 = 8px
gap-3 = 12px
```

### **Custom Sizes**
```tsx
// Use square brackets for exact values
className="w-[120px]"          // Width 120px
className="h-[52px]"           // Height 52px
className="text-[11px]"        // Font size 11px
className="text-[28px]"        // Font size 28px
className="leading-[18px]"     // Line height 18px
```

---

## ⚠️ Common Mistakes to Avoid

### **1. ❌ DON'T Mix StyleSheet with NativeWind**
```tsx
// ❌ WRONG
<View className="flex-1" style={styles.container}>
  <Text>Mixed styles</Text>
</View>
const styles = StyleSheet.create({
  container: { padding: 20 }
});

// ✅ CORRECT
<View className="flex-1 p-5">
  <Text>NativeWind only</Text>
</View>
```

### **2. ❌ DON'T Forget textAlignVertical for Multiline TextInput**
```tsx
// ❌ WRONG - Text will center vertically
<TextInput
  className="bg-gray-800/60 rounded-lg p-3 min-h-[80px]"
  multiline
/>

// ✅ CORRECT - Text starts at top
<TextInput
  className="bg-gray-800/60 rounded-lg p-3 min-h-[80px]"
  style={{ textAlignVertical: 'top' }}
  multiline
/>
```

### **3. ❌ DON'T Nest FlatList in ScrollView**
```tsx
// ❌ WRONG - Performance warning
<ScrollView>
  <FlatList data={items} />
</ScrollView>

// ✅ CORRECT - Use ListHeaderComponent
<FlatList
  data={items}
  ListHeaderComponent={<Header />}
  ListFooterComponent={<Footer />}
/>
```

### **4. ❌ DON'T Forget Platform-Specific Behavior**
```tsx
// ❌ WRONG - Won't work well on both platforms
<KeyboardAvoidingView className="flex-1">
  <Form />
</KeyboardAvoidingView>

// ✅ CORRECT - Platform-specific behavior
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  className="flex-1"
>
  <Form />
</KeyboardAvoidingView>
```

---

## 📚 Quick Reference

### **File Structure**
```tsx
import { View, Text, TouchableOpacity } from 'react-native';
// ✅ NO StyleSheet import needed!

export default function Component() {
  return (
    <View className="flex-1 bg-black">
      <Text className="text-white">Hello</Text>
    </View>
  );
}

// ✅ NO StyleSheet.create() needed!
```

### **Conditional Classes**
```tsx
// ✅ CORRECT - Template literals
<View className={`p-4 ${isActive ? 'bg-blue-500' : 'bg-gray-800'}`}>
  <Text className={`font-semibold ${isActive ? 'text-white' : 'text-gray-400'}`}>
    Text
  </Text>
</View>
```

### **Combining className and style**
```tsx
// ✅ CORRECT - Use style only for dynamic values
<View 
  className="px-2.5 py-1 rounded-xl"
  style={{ backgroundColor: dynamicColor }}
>
  <Text style={{ color: dynamicTextColor }}>Dynamic</Text>
</View>
```

---

## 🎯 Pattern Checklist

When creating a new component, ensure:

- [ ] No `StyleSheet` import
- [ ] No `StyleSheet.create()`
- [ ] All static styles use `className`
- [ ] Dynamic styles use `style` prop
- [ ] Spacing uses Tailwind scale (p-4, m-3, etc.)
- [ ] Colors use semantic names (bg-gray-800, text-white)
- [ ] Multiline TextInput has `textAlignVertical: 'top'`
- [ ] Modal has proper structure (Header/Content/Footer)
- [ ] Buttons have proper touch feedback
- [ ] Lists use FlatList, not nested in ScrollView
- [ ] Platform-specific code uses Platform.OS

---

## 💡 Pro Tips

1. **Use gap instead of margin** - `gap-2` is cleaner than `mb-2` on all items
2. **Opacity in colors** - `bg-black/70` instead of rgba()
3. **Conditional rendering** - Use template literals for dynamic classes
4. **Custom values** - Use `[value]` syntax for exact sizes
5. **Hover states** - Not needed in mobile (use activeOpacity instead)

---

## 🚀 Migration Checklist

When converting existing StyleSheet to NativeWind:

1. Remove `StyleSheet` import
2. Remove `const styles = StyleSheet.create({...})`
3. Convert `style={styles.X}` to `className="..."`
4. Keep `style={}` only for dynamic values
5. Test on both iOS and Android
6. Check for any conditional styling
7. Verify spacing and colors match original

---

**Remember:** NativeWind = Faster development, cleaner code, better maintainability!

Last Updated: 2025-11-12

