import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

/**
 * Custom hook for dynamic image sizing that responds to screen dimension changes
 * @param columns - Number of columns in the grid (default: 3)
 * @param padding - Padding to subtract from each image (default: 4)
 * @returns The calculated image size
 */
export function useImageSize(columns: number = 3, padding: number = 4) {
  const [imageSize, setImageSize] = useState(
    (Dimensions.get('window').width) / columns
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setImageSize(window.width / columns);
    });
    
    return () => {
      subscription?.remove();
    };
  }, [columns]);

  return imageSize - padding;
}
