import React, { useState, useEffect } from 'react';
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
import { X, MapPin, AtSign, Smile, User as UserIcon, ChevronLeft, AlertTriangle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost, CreatePostRequest, PostMedia } from '~/api/apiservice/post_api';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { useUser } from '@clerk/clerk-expo';
import { useCameraContext, MediaItem } from '~/context/CameraContext';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useAppTabContext } from '~/context/AppTabContext';

// Server accepts: image/png, image/gif, video/mp4, image/jpg, image/jpeg, video/mpeg, video/webm
const IMAGE_MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpg',  // Server accepts 'image/jpg' specifically
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  // Removed unsupported types: heic, heif, webp
};

const VIDEO_MIME_TYPES: Record<string, string> = {
  mp4: 'video/mp4',
  mpeg: 'video/mpeg',
  webm: 'video/webm',
  mov: 'video/quicktime', // QuickTime format - now supported by backend
  // Removed unsupported types: m4v, avi, mkv
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
  const [fileSizeWarning, setFileSizeWarning] = useState<{
    hasWarning: boolean;
    message: string;
    fileCount: number;
  }>({ hasWarning: false, message: '', fileCount: 0 });

  const {
    selectedMedia,
    resetPostData,
    cropMedia
  } = useCameraContext();

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const firstMediaUri = selectedMedia[0]?.uri;

  // Check file sizes when selectedMedia changes
  useEffect(() => {
    const checkFileSizes = async () => {
      if (selectedMedia.length === 0) {
        setFileSizeWarning({ hasWarning: false, message: '', fileCount: 0 });
        return;
      }

      const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
      const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
      let oversizedFiles: Array<{ type: string; sizeMB: number }> = [];

      for (const media of selectedMedia) {
        let fileSize: number | undefined;

        // Try to get file size from MediaLibrary or FileSystem
        if (media.id && !media.id.startsWith('camera_')) {
          try {
            const assetInfo = await MediaLibrary.getAssetInfoAsync(media.id);
            // AssetInfo doesn't have size property, try to get it from the file URI
            const fileUri = assetInfo.localUri || assetInfo.uri;
            if (fileUri) {
              try {
                const fileInfo = await FileSystem.getInfoAsync(fileUri);
                if (fileInfo.exists && 'size' in fileInfo) {
                  fileSize = fileInfo.size;
                }
              } catch (fileError) {
                console.warn('Could not get file size from FileSystem:', fileError);
              }
            }
          } catch (error) {
            // If we can't get size, skip this file
            console.warn('Could not get file size from MediaLibrary:', error);
            continue;
          }
        }

        if (fileSize !== undefined) {
          const maxSize = media.mediaType === 'video' ? MAX_VIDEO_SIZE : MAX_PHOTO_SIZE;
          const maxSizeMB = maxSize / (1024 * 1024);
          const fileSizeMB = fileSize / (1024 * 1024);

          if (fileSize > maxSize) {
            const mediaType = media.mediaType === 'video' ? 'video' : 'photo';
            oversizedFiles.push({ type: mediaType, sizeMB: fileSizeMB });
          }
        }
      }

      if (oversizedFiles.length > 0) {
        const videoCount = oversizedFiles.filter(f => f.type === 'video').length;
        const photoCount = oversizedFiles.filter(f => f.type === 'photo').length;
        
        let message = '';
        if (videoCount > 0 && photoCount > 0) {
          message = `${videoCount} video${videoCount > 1 ? 's' : ''} and ${photoCount} photo${photoCount > 1 ? 's' : ''} exceed size limit`;
        } else if (videoCount > 0) {
          message = `${videoCount} video${videoCount > 1 ? 's' : ''} exceed${videoCount > 1 ? '' : 's'} the 100MB limit`;
        } else {
          message = `${photoCount} photo${photoCount > 1 ? 's' : ''} exceed${photoCount > 1 ? '' : 's'} the 10MB limit`;
        }

        setFileSizeWarning({
          hasWarning: true,
          message,
          fileCount: oversizedFiles.length,
        });
      } else {
        setFileSizeWarning({ hasWarning: false, message: '', fileCount: 0 });
      }
    };

    checkFileSizes();
  }, [selectedMedia]);

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: CreatePostRequest) => {
      console.log('[caption] Mutation function called, postMedias count:', postData.postMedias?.length);
      try {
        const result = await createPost(postData);
        console.log('[caption] createPost returned successfully');
        return result;
      } catch (error) {
        console.error('[caption] Error in createPost:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Post created successfully');
      // Invalidate queries to refresh feeds
      queryClient.invalidateQueries({ queryKey: ['profilePagePosts'] });
      queryClient.invalidateQueries({ queryKey: ['homePagePosts'] });
      queryClient.invalidateQueries({ queryKey: ['explorePagePosts'] });
      queryClient.invalidateQueries({ queryKey: ['clientProfilePosts'] });
      
      // Invalidate useProfileQueries queries - invalidate all user profiles and user posts
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      
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
    onError: (error: any) => {
      console.error('[caption] Error creating post:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      console.error('[caption] Full error details:', JSON.stringify(error, null, 2));
      
      // Check for file size error
      if (errorMessage.includes('File size exceeds') || errorMessage.includes('100MB')) {
        Alert.alert(
          'File Too Large',
          'The video file exceeds the 100MB limit. Please select a smaller video or compress it before uploading.'
        );
      } else {
        Alert.alert('Error', `Failed to create post: ${errorMessage}`);
      }
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
    // Always convert extension to lowercase for consistent lookup
    let extension =
      filenameCandidate &&
        filenameCandidate.includes('.')
        ? filenameCandidate.split('.').pop()?.toLowerCase()
        : undefined;

    if (!extension || extension.length > 5) {
      extension = fallbackExtension;
    }

    // Normalize extension to lowercase for all comparisons
    extension = extension.toLowerCase();

    // Check for unsupported video formats
    const unsupportedVideoExtensions = ['m4v', 'avi', 'mkv', 'flv', 'wmv'];
    if (media.mediaType === 'video' && extension && unsupportedVideoExtensions.includes(extension)) {
      const errorMsg = `Video format .${extension.toUpperCase()} is not supported. Please use MP4, MPEG, WebM, or MOV format.`;
      console.error(errorMsg);
      Alert.alert('Unsupported Video Format', errorMsg);
      throw new Error(errorMsg);
    }

    // Ensure mimeType matches server-accepted types
    // Server accepts: image/png, image/gif, video/mp4, image/jpg, image/jpeg, video/mpeg, video/webm, video/quicktime
    let mimeType: string;
    if (media.mediaType === 'video') {
      // Lookup with lowercase extension (handles .MOV, .mov, .MP4, .mp4, etc.)
      mimeType = VIDEO_MIME_TYPES[extension] || 'video/mp4';
      
      // Debug logging for video format detection
      console.log(`[deriveFileMeta] Video detected - extension: ${extension}, mimeType: ${mimeType}, filename: ${filenameCandidate}`);
      
      // Validate against server-accepted video types
      if (!['video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime'].includes(mimeType)) {
        // If extension is not supported, this is an error
        if (extension && !['mp4', 'mpeg', 'webm', 'mov'].includes(extension)) {
          const errorMsg = `Video format .${extension.toUpperCase()} is not supported. Please convert to MP4, MPEG, WebM, or MOV format.`;
          console.error(errorMsg);
          Alert.alert('Unsupported Video Format', errorMsg);
          throw new Error(errorMsg);
        }
        mimeType = 'video/mp4'; // Fallback to accepted type
      }
    } else {
      mimeType = IMAGE_MIME_TYPES[extension] || 'image/jpeg';
      // Validate against server-accepted image types
      if (!['image/png', 'image/gif', 'image/jpg', 'image/jpeg'].includes(mimeType)) {
        mimeType = 'image/jpeg'; // Fallback to accepted type
      }
    }

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
    
    // Validate file sizes before upload
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
    const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
    
    try {
      // Check file sizes first
      for (const media of selectedMedia) {
        let fileSize: number | undefined;
        
        // Try to get file size from MediaLibrary or FileSystem
        if (media.id && !media.id.startsWith('camera_')) {
          try {
            const assetInfo = await MediaLibrary.getAssetInfoAsync(media.id);
            // AssetInfo doesn't have size property, try to get it from the file URI
            const fileUri = assetInfo.localUri || assetInfo.uri;
            if (fileUri) {
              try {
                const fileInfo = await FileSystem.getInfoAsync(fileUri);
                if (fileInfo.exists && 'size' in fileInfo) {
                  fileSize = fileInfo.size;
                }
              } catch (fileError) {
                console.warn('Could not get file size from FileSystem:', fileError);
              }
            }
          } catch (error) {
            console.warn('Could not get file size from MediaLibrary:', error);
          }
        }
        
        // If we have file size, validate it
        if (fileSize !== undefined) {
          const maxSize = media.mediaType === 'video' ? MAX_VIDEO_SIZE : MAX_PHOTO_SIZE;
          const maxSizeMB = maxSize / (1024 * 1024);
          const fileSizeMB = fileSize / (1024 * 1024);
          const mediaType = media.mediaType === 'video' ? 'video' : 'photo';
          
          if (fileSize > maxSize) {
            Alert.alert(
              'File Too Large',
              `The selected ${mediaType} is ${fileSizeMB.toFixed(1)}MB, which exceeds the maximum limit of ${maxSizeMB}MB. Please select a smaller file or compress it.`
            );
            return;
          }
          
          console.log(`[handleShare] File size check: ${mediaType} = ${fileSizeMB.toFixed(1)}MB (max: ${maxSizeMB}MB) ✓`);
        }
      }
      
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

          // Validate URI format for React Native FormData
          if (!uploadUri.startsWith('file://') && !uploadUri.startsWith('http://') && !uploadUri.startsWith('https://') && !uploadUri.startsWith('content://')) {
            console.warn(`[caption] URI missing protocol, adding file://: ${uploadUri.substring(0, 50)}`);
            // Don't modify - let it fail naturally so we can see the actual error
          }

          const { fileName, mimeType } = deriveFileMeta(media, uploadUri, index);

          // Debug logging for mimeType
          console.log(`Media ${index}: type=${media.mediaType}, fileName=${fileName}, mimeType=${mimeType}, uri=${uploadUri.substring(0, 80)}...`);

          // Use actual crop data if available, otherwise use default (no crop)
          const cropData = croppedMedia.cropData || {
            x: 0,
            y: 0,
            width: finalWidth,
            height: finalHeight,
            zoom: 1,
            naturalWidth: croppedMedia.width || finalWidth,
            naturalHeight: croppedMedia.height || finalHeight,
          };

          return {
            uri: uploadUri,
            isVideo: media.mediaType === 'video',
            fileName,
            mimeType,
            cropData,
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

          {/* File Size Warning */}
          {fileSizeWarning.hasWarning && (
            <View className="mx-4 mt-2 mb-2 px-4 py-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg flex-row items-center">
              <AlertTriangle size={20} color="#fbbf24" />
              <Text className="text-yellow-400 ml-3 flex-1 text-sm">
                {fileSizeWarning.message}. Upload may fail.
              </Text>
            </View>
          )}

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

