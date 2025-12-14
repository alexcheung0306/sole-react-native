import { Platform, Dimensions } from 'react-native';

/**
 * Get the device screen border radius
 * 
 * React Native doesn't expose screen border radius directly, so we use:
 * 1. Platform-specific known values
 * 2. Safe area insets to infer rounded corners
 * 3. Device model detection (if available)
 * 
 * @returns The border radius in pixels (typically 0-50px for modern devices)
 */
export function getDeviceScreenRadius(): number {
  const { width, height } = Dimensions.get('window');
  const isIOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';

  // iOS devices with rounded corners
  if (isIOS) {
    // iPhone X and later (notched devices) typically have ~39px radius
    // iPhone 14 Pro Max and later have ~55px radius
    // We can infer from screen dimensions
    
    // iPhone X/XS/11 Pro: 375x812 or 414x896
    // iPhone 12/13/14: 390x844 or 428x926
    // iPhone 14 Pro Max: 430x932
    
    if (width >= 390 || height >= 844) {
      // iPhone 12 and later (larger radius)
      return 55;
    } else if (width >= 375 || height >= 812) {
      // iPhone X/XS/11 Pro (standard radius)
      return 39;
    } else {
      // Older iPhones (no rounded corners)
      return 0;
    }
  }

  // Android devices
  if (isAndroid) {
    // Most modern Android devices have rounded corners
    // Typical values: 16-24px for most devices
    // Some devices like Pixel 6+ have ~28px
    
    // Infer from screen size - larger screens often have more radius
    if (width >= 400 || height >= 800) {
      // Large Android devices (Pixel 6+, Samsung S21+, etc.)
      return 28;
    } else if (width >= 360 || height >= 640) {
      // Standard Android devices
      return 20;
    } else {
      // Smaller devices
      return 16;
    }
  }

  // Default fallback
  return 0;
}

/**
 * Get device screen border radius with safe area context
 * This provides more accurate results by checking if device has notches/rounded corners
 * 
 * @param insets - Safe area insets from useSafeAreaInsets()
 * @returns The border radius in pixels
 */
export function getDeviceScreenRadiusWithInsets(insets: {
  top: number;
  bottom: number;
  left: number;
  right: number;
}): number {
  const baseRadius = getDeviceScreenRadius();
  
  // If device has significant safe area insets (notch/rounded corners), confirm radius
  const hasNotch = insets.top > 20 || insets.bottom > 0;
  const hasRoundedCorners = insets.left > 0 || insets.right > 0;
  
  if (hasNotch || hasRoundedCorners) {
    // Device definitely has rounded corners
    // Use platform-specific values
    if (Platform.OS === 'ios') {
      // iOS devices with notch typically have 39-55px radius
      return insets.top > 40 ? 55 : 39;
    } else {
      // Android devices typically have 16-28px radius
      return Math.max(baseRadius, 20);
    }
  }
  
  return baseRadius;
}

/**
 * Common device border radius values (for reference)
 */
export const DEVICE_SCREEN_RADIUS = {
  // iOS
  iPhoneX: 39,
  iPhone12: 55,
  iPhone14Pro: 55,
  
  // Android
  Pixel6: 28,
  SamsungS21: 24,
  StandardAndroid: 20,
  
  // Defaults
  None: 0,
  Small: 16,
  Medium: 20,
  Large: 28,
  XLarge: 39,
  XXLarge: 55,
} as const;


