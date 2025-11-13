import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

export interface MediaItem {
  id: string;
  uri: string;
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

interface CreatePostContextType {
  selectedMedia: MediaItem[];
  setSelectedMedia: (media: MediaItem[]) => void;
  addMedia: (media: MediaItem) => void;
  removeMedia: (id: string) => void;
  clearMedia: () => void;
  selectedAspectRatio: 'free' | '1:1' | '4:5' | '16:9';
  setSelectedAspectRatio: (ratio: 'free' | '1:1' | '4:5' | '16:9') => void;
  caption: string;
  setCaption: (caption: string) => void;
  location: string;
  setLocation: (location: string) => void;
  taggedUsers: string[];
  setTaggedUsers: (users: string[]) => void;
  resetPostData: () => void;
}

const CreatePostContext = createContext<CreatePostContextType | undefined>(undefined);

export function CreatePostProvider({ children }: { children: ReactNode }) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<'free' | '1:1' | '4:5' | '16:9'>('free');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);

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
    setCaption('');
    setLocation('');
    setTaggedUsers([]);
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
      caption,
      setCaption,
      location,
      setLocation,
      taggedUsers,
      setTaggedUsers,
      resetPostData,
    }),
    [
      selectedMedia,
      addMedia,
      removeMedia,
      clearMedia,
      selectedAspectRatio,
      setSelectedAspectRatio,
      caption,
      location,
      taggedUsers,
      setCaption,
      setLocation,
      setTaggedUsers,
      resetPostData,
    ]
  );

  return (
    <CreatePostContext.Provider value={value}>
      {children}
    </CreatePostContext.Provider>
  );
}

export function useCreatePostContext() {
  const context = useContext(CreatePostContext);
  if (context === undefined) {
    throw new Error('useCreatePostContext must be used within a CreatePostProvider');
  }
  return context;
}

