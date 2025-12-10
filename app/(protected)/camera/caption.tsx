import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { X, MapPin, AtSign, Smile, User as UserIcon, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost, CreatePostRequest, PostMedia } from '~/api/apiservice/post_api';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { useUser } from '@clerk/clerk-expo';
import { useCameraContext, MediaItem } from '~/context/CameraContext';
import * as MediaLibrary from 'expo-media-library';
import { useAppTabContext } from '~/context/AppTabContext';

const IMAGE_MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
  webp: 'image/webp',
};

const VIDEO_MIME_TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
};

const MAX_CAPTION_LENGTH = 256;

export default function CaptionScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { soleUserId } = useSoleUserContext();
  const {setActiveTab} = useAppTabContext();
  const queryClient = useQueryClient();

  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);

  const {
    selectedMedia,
    resetPostData,
    cropMedia
  } = useCameraContext();

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const firstMediaUri = selectedMedia[0]?.uri;

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: CreatePostRequest) => {
      return await createPost(postData);
    },
    onSuccess: () => {
      console.log('Post created successfully');
      // Invalidate queries to refresh feeds
      queryClient.invalidateQueries({ queryKey: ['profilePagePosts'] });
      queryClient.invalidateQueries({ queryKey: ['homePagePosts'] });
      queryClient.invalidateQueries({ queryKey: ['explorePagePosts'] });
      queryClient.invalidateQueries({ queryKey: ['clientProfilePosts'] });
      router.push('/(protected)/(user)' as any);
      setActiveTab('home');
      Alert.alert('Success', 'Your post has been shared!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset post data
            resetPostData();
            // Navigate to home
           
          },
        },
      ]);
    },
    onError: (error) => {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    },
  });

  const handleCaptionChange = (text: string) => {
    if (text.length <= MAX_CAPTION_LENGTH) {
      setCaption(text);
    } else {
      Alert.alert('Character Limit', `Caption must be ${MAX_CAPTION_LENGTH} characters or less`);
    }
  };

  const resolveUploadUri = async (media: MediaItem) => {
    if (!media.uri) {
      return undefined;
    }

    const isLibraryAsset = media.id && !media.id.startsWith('camera_');
    const needsResolution =
      media.uri.startsWith('ph://') || media.uri.startsWith('assets-library://');

    if (isLibraryAsset && needsResolution) {
      try {
        const assetInfo = await MediaLibrary.getAssetInfoAsync(media.id);
        if (assetInfo?.localUri) {
          return assetInfo.localUri;
        }
        if (assetInfo?.uri?.startsWith('file://')) {
          return assetInfo.uri;
        }
      } catch (error) {
        console.warn('Failed to resolve local URI for media asset', media.id, error);
      }
    }

    return media.uri;
  };

  const deriveFileMeta = (media: MediaItem, uploadUri: string, index: number) => {
    const fallbackExtension = media.mediaType === 'video' ? 'mp4' : 'jpg';
    const filenameCandidate =
      media.filename ||
      uploadUri
        .split('/')
        .pop()
        ?.split('?')[0];
    let extension =
      filenameCandidate &&
        filenameCandidate.includes('.')
        ? filenameCandidate.split('.').pop()?.toLowerCase()
        : undefined;

    if (!extension || extension.length > 5) {
      extension = fallbackExtension;
    }

    const mimeType =
      media.mediaType === 'video'
        ? VIDEO_MIME_TYPES[extension] || 'video/mp4'
        : IMAGE_MIME_TYPES[extension] || 'image/jpeg';

    const fileName =
      filenameCandidate && filenameCandidate.includes('.')
        ? filenameCandidate
        : `post_${index}.${extension}`;

    return { fileName, mimeType };
  };

  const handleShare = async () => {
    if (selectedMedia.length === 0) {
      Alert.alert('No Media', 'Please select at least one photo or video');
      return;
    }
    if (!soleUserId) {
      Alert.alert('Error', 'User not found. Please sign in again.');
      return;
    }
    try {
      const postMedias: PostMedia[] = await Promise.all(
        selectedMedia.map(async (media, index) => {
          // Apply crop using the context function
          const croppedMedia = await cropMedia(media);
          
          const finalUri = croppedMedia.uri;
          const finalWidth = croppedMedia.width || 1080;
          const finalHeight = croppedMedia.height || 1080;

          const uploadUri = await resolveUploadUri({ ...croppedMedia, uri: finalUri });

          if (!uploadUri) {
            throw new Error('Unable to access selected media file');
          }

          const { fileName, mimeType } = deriveFileMeta(media, uploadUri, index);

          return {
            uri: uploadUri,
            isVideo: media.mediaType === 'video',
            fileName,
            mimeType,
            cropData: {
              x: 0,
              y: 0,
              width: finalWidth,
              height: finalHeight,
              zoom: 1,
              naturalWidth: finalWidth,
              naturalHeight: finalHeight,
            },
          };
        })
      );

      const postData: CreatePostRequest = {
        soleUserId,
        content: caption,
        postMedias,
      };

      createPostMutation.mutate(postData);
    } catch (error) {
      console.error('Failed to prepare media for upload', error);
      Alert.alert(
        'Media Error',
        'We could not access one of the selected files. Please reselect your media and try again.'
      );
    }
  };



  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black"
        style={{ paddingTop: insets.top }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-white font-semibold text-lg">New Post</Text>
          <TouchableOpacity
            onPress={handleShare}
            disabled={createPostMutation.isPending}
            className="p-2"
          >
            {createPostMutation.isPending ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <Text className="text-blue-500 font-semibold">Share</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* User Info & Media Preview */}
          <View className="flex-row p-4 border-b border-gray-800">
            {/* User Avatar */}
            <View className="mr-3">
              {user?.imageUrl ? (
                <ExpoImage
                  source={{ uri: user.imageUrl }}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <View className="w-12 h-12 rounded-full bg-gray-700 items-center justify-center">
                  <UserIcon size={24} color="#9ca3af" />
                </View>
              )}
            </View>

            {/* Caption Input */}
            <View className="flex-1 mr-3">
              <Text className="text-white font-semibold mb-2">
                {user?.username || 'User'}
              </Text>
              <TextInput
                className="text-white text-base"
                placeholder="Write a caption..."
                placeholderTextColor="#6b7280"
                value={caption}
                onChangeText={handleCaptionChange}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{ minHeight: 80 }}
              />
              <Text className="text-gray-500 text-xs mt-1">
                {caption.length}/{MAX_CAPTION_LENGTH}
              </Text>
            </View>

            {/* Media Thumbnail */}
            {firstMediaUri && (
              <ExpoImage
                source={{ uri: firstMediaUri }}
                style={{ width: 60, height: 60 }}
                className="rounded-lg"
                contentFit="cover"
              />
            )}
          </View>

    

          {/* Add Location */}
          <TouchableOpacity
            onPress={() => {
              // TODO: Implement location picker
              Alert.alert('Coming Soon', 'Location tagging will be available soon');
            }}
            className="flex-row items-center px-4 py-3 border-b border-gray-800"
          >
            <MapPin size={24} color="#ffffff" />
            <Text className="text-white ml-3 flex-1">
              {location || 'Add Location'}
            </Text>
          </TouchableOpacity>

          {/* Tag People */}
          <TouchableOpacity
            onPress={() => {
              // TODO: Implement people tagging
              Alert.alert('Coming Soon', 'People tagging will be available soon');
            }}
            className="flex-row items-center px-4 py-3 border-b border-gray-800"
          >
            <AtSign size={24} color="#ffffff" />
            <Text className="text-white ml-3 flex-1">Tag People</Text>
          </TouchableOpacity>

          {/* Media Count Info */}
          <View className="px-4 py-3 bg-gray-800/30">
            <Text className="text-gray-400 text-sm">
              {selectedMedia.length} {selectedMedia.length === 1 ? 'item' : 'items'} selected
            </Text>
          </View>
        </ScrollView>

        {/* Share Button (Fixed Bottom) */}
        {/* <View className="px-4 py-3 border-t border-gray-800">
          <TouchableOpacity
            onPress={handleShare}
            disabled={createPostMutation.isPending || selectedMedia.length === 0}
            className={`rounded-lg py-3 ${createPostMutation.isPending || selectedMedia.length === 0
              ? 'bg-blue-500/50'
              : 'bg-blue-500'
              }`}
          >
            {createPostMutation.isPending ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#ffffff" />
                <Text className="text-white font-semibold ml-2">Sharing...</Text>
              </View>
            ) : (
              <Text className="text-white font-semibold text-center">Share Post</Text>
            )}
          </TouchableOpacity>
        </View> */}
      </KeyboardAvoidingView>
    </>
  );
}

