import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

export interface MediaItem {
  id: string;
  uri: string;
  originalUri?: string;
  mediaType: 'photo' | 'video';
  width?: number;
  height?: number;
  duration?: number;
  filename?: string;
  aspectRatio?: '1:1' | '4:5' | '16:9';
  cropData?: {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
    naturalWidth?: number;
    naturalHeight?: number;
  };
}

export interface PhotosCache {
  photos: MediaItem[];
  timestamp: number;
}

interface CameraContextType {
  selectedMedia: MediaItem[];
  setSelectedMedia: (media: MediaItem[]) => void;
  addMedia: (media: MediaItem) => void;
  removeMedia: (id: string) => void;
  clearMedia: () => void;
  selectedAspectRatio: 'free' | '1:1' | '4:5' | '16:9';
  setSelectedAspectRatio: (ratio: 'free' | '1:1' | '4:5' | '16:9') => void;
  resetPostData: () => void;
  cropMedia: (media: MediaItem) => Promise<MediaItem>;
  photosCache: PhotosCache | null;
  setPhotosCache: (cache: PhotosCache | null) => void;
  getPhotosCache: () => PhotosCache | null;
  clearPhotosCache: () => void;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

export function CameraProvider({ children }: { children: ReactNode }) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<'free' | '1:1' | '4:5' | '16:9'>('free');
  const [photosCache, setPhotosCacheState] = useState<PhotosCache | null>(null);

  const addMedia = useCallback((media: MediaItem) => {
    setSelectedMedia((prev) => [...prev, media]);
  }, []);

  const removeMedia = useCallback((id: string) => {
    setSelectedMedia((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const clearMedia = useCallback(() => {
    setSelectedMedia([]);
  }, []);

  const resetPostData = useCallback(() => {
    setSelectedMedia([]);
    setSelectedAspectRatio('free');
  }, []);

  const setPhotosCache = useCallback((cache: PhotosCache | null) => {
    setPhotosCacheState(cache);
  }, []);

  const getPhotosCache = useCallback(() => {
    return photosCache;
  }, [photosCache]);

  const clearPhotosCache = useCallback(() => {
    setPhotosCacheState(null);
  }, []);

  /**
   * Crops a media item based on its cropData.
   * For photos: applies actual crop using ImageManipulator
   * For videos: stores crop data for server-side processing using FFmpeg
   * (Native video processing libraries have compatibility issues with Expo managed workflow)
   * Returns the original media item if cropping is not needed or fails.
   */
  const cropMedia = useCallback(async (media: MediaItem): Promise<MediaItem> => {
    // If no crop data, return original
    if (!media.cropData) {
      return media;
    }

    // Handle videos with server-side processing
    // TODO: Upgrade to native video processing when compatible Expo libraries become available
    // Current options to explore:
    // - expo-video with FFmpeg integration
    // - Custom native module using Expo Modules API
    // - Third-party services like Cloudinary or Mux
    if (media.mediaType === 'video') {
      console.log('[VideoCropping] Video cropping will be processed server-side:', {
        mediaUri: media.uri.substring(0, 50) + '...',
        cropData: media.cropData,
        platform: Platform.OS,
        note: 'Native video processing libraries have compatibility issues with Expo managed workflow'
      });

      // Validate crop data before sending to server
      if (!media.cropData.width || !media.cropData.height ||
          media.cropData.width <= 0 || media.cropData.height <= 0) {
        console.warn('[VideoCropping] Invalid crop data for video:', media.cropData);
      }

      // Return media with crop data for server-side processing
      // The server should use FFmpeg with commands like:
      // ffmpeg -i input.mp4 -vf crop=w:h:x:y -c:a copy output.mp4
      return {
        ...media,
        cropData: media.cropData,
      };
    }

    // Handle photos with crop data
    if (media.mediaType !== 'photo') {
      return media;
    }

    try {
      // Use originalUri if available to ensure best quality and correct coordinates
      const sourceUri = media.originalUri ?? media.uri;
      
      // Get the natural dimensions from cropData or fallback to media dimensions
      const naturalWidth = media.cropData.naturalWidth ?? media.width ?? 1080;
      const naturalHeight = media.cropData.naturalHeight ?? media.height ?? 1080;
      
      // Validate that we have valid crop data
      if (!media.cropData.width || !media.cropData.height || 
          media.cropData.width <= 0 || media.cropData.height <= 0) {
        console.warn('Invalid crop data, skipping crop:', media.cropData);
        return media;
      }

      // Round and clamp crop coordinates to ensure they're valid integers within bounds
      const cropX = Math.max(0, Math.min(Math.round(media.cropData.x), naturalWidth - 1));
      const cropY = Math.max(0, Math.min(Math.round(media.cropData.y), naturalHeight - 1));
      
      let cropWidth = Math.max(1, Math.min(
        Math.round(media.cropData.width),
        naturalWidth - cropX
      ));
      let cropHeight = Math.max(1, Math.min(
        Math.round(media.cropData.height),
        naturalHeight - cropY
      ));

      // Ensure crop doesn't exceed image bounds
      if (cropX + cropWidth > naturalWidth) {
        cropWidth = naturalWidth - cropX;
      }
      if (cropY + cropHeight > naturalHeight) {
        cropHeight = naturalHeight - cropY;
      }

      // Ensure valid dimensions
      if (cropWidth <= 0 || cropHeight <= 0) {
        console.warn('Invalid crop dimensions, using original');
        return media;
      }

      const actions = [
        {
          crop: {
            originX: cropX,
            originY: cropY,
            width: cropWidth,
            height: cropHeight,
          },
        },
      ];

      const result = await ImageManipulator.manipulateAsync(sourceUri, actions, {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      return {
        ...media,
        uri: result.uri,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('Failed to crop media:', error);
      // Return original media on error
      return media;
    }
  }, []);

  const value = useMemo(
    () => ({
      selectedMedia,
      setSelectedMedia,
      addMedia,
      removeMedia,
      clearMedia,
      selectedAspectRatio,
      setSelectedAspectRatio,
      resetPostData,
      cropMedia,
      photosCache,
      setPhotosCache,
      getPhotosCache,
      clearPhotosCache,
    }),
    [
      selectedMedia,
      addMedia,
      removeMedia,
      clearMedia,
      selectedAspectRatio,
      setSelectedAspectRatio,
      resetPostData,
      cropMedia,
      photosCache,
      setPhotosCache,
      getPhotosCache,
      clearPhotosCache,
    ]
  );

  return (
    <CameraContext.Provider value={value}>
      {children}
    </CameraContext.Provider>
  );
}

export function useCameraContext() {
  const context = useContext(CameraContext);
  if (context === undefined) {
    throw new Error('useCameraContext must be used within a CameraProvider');
  }
  return context;
}

