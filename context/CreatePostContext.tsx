import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

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

interface CameraContextType {
  selectedMedia: MediaItem[];
  setSelectedMedia: (media: MediaItem[]) => void;
  addMedia: (media: MediaItem) => void;
  removeMedia: (id: string) => void;
  clearMedia: () => void;
  selectedAspectRatio: 'free' | '1:1' | '4:5' | '16:9';
  setSelectedAspectRatio: (ratio: 'free' | '1:1' | '4:5' | '16:9') => void;
  resetPostData: () => void;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export function CameraProvider({ children }: { children: ReactNode }) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<'free' | '1:1' | '4:5' | '16:9'>('free');

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
    }),
    [
      selectedMedia,
      addMedia,
      removeMedia,
      clearMedia,
      selectedAspectRatio,
      setSelectedAspectRatio,
      resetPostData,
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

