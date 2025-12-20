import { View, TouchableOpacity, ScrollView, Text, RefreshControl, Dimensions, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import {
  ChevronLeft,
  Play,
  Pause,
} from 'lucide-react-native';
import { useCallback, useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useScrollHeader } from '~/hooks/useScrollHeader';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { VideoView, useVideoPlayer } from 'expo-video';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
  route: string;
  isActivated: boolean;
}

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  const queryClient = useQueryClient();
  const { soleUser } = useSoleUserContext();
  const [refreshing, setRefreshing] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [bufferedProgress, setBufferedProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Hardcoded video player - replace with your video URI
  const hardcodedVideoUri = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  const player = useVideoPlayer(hardcodedVideoUri, (player) => {
    player.loop = true;
    player.muted = true;
  });

  // Monitor video loading and buffering status
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const checkStatus = () => {
      try {
        // Check if video has loaded and has duration
        const duration = player.duration;
        const currentTime = player.currentTime;
        const status = player.status;
        const playing = player.playing;
        
        // Update playing state
        setIsPlaying(playing);
        
        if (duration > 0) {
          // Video metadata loaded
          // Calculate buffered progress
          const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
          setBufferedProgress(progress);
          
          // Update playback progress and time
          setCurrentProgress(progress);
          setCurrentTime(currentTime);
          setVideoDuration(duration);
          
          // Video is ready when duration is available and status is not 'loading'
          if (status !== 'loading' && duration > 0) {
            setIsVideoLoading(false);
            // Don't clear interval - keep tracking progress
          } else if (status === 'loading') {
            setIsVideoLoading(true);
          }
        } else {
          // Still loading metadata
          setIsVideoLoading(true);
        }
      } catch (error) {
        // Ignore errors during initial loading
        console.warn('Video status check error:', error);
      }
    };

    // Start playing the video
    player.play();

    // Check status periodically (every 200ms for better performance)
    interval = setInterval(checkStatus, 200);

    // Initial check
    checkStatus();

    // Cleanup interval on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [player]);

  // Format time helper
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Toggle controls visibility (tap video area)
  const toggleControls = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);

  // Play/Pause button handler (only controls playback, then hides controls)
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!isPlaying);
    
    // Auto-hide controls after tapping play/pause
    setTimeout(() => {
      setShowControls(false);
    }, 300);
  }, [isPlaying, player]);

  // Handle progress bar seek
  const handleSeek = useCallback((event: any) => {
    const { locationX } = event.nativeEvent;
    const progressBarWidth = width - 56; // Account for padding (12px * 2 on each side)
    const seekPercentage = Math.max(0, Math.min(1, locationX / progressBarWidth));
    const seekTime = seekPercentage * videoDuration;
    
    player.currentTime = seekTime;
    setCurrentProgress(seekPercentage * 100);
    setCurrentTime(seekTime);
  }, [videoDuration, player, width]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['soleUser'] });
    setRefreshing(false);
  }, [queryClient]);

  return (
    <>
      <View className="flex-1 bg-black">
        <CollapsibleHeader
          headerLeft={
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.85}
              className="flex items-center justify-center p-2">
              <ChevronLeft color="#93c5fd" size={24} />
            </TouchableOpacity>
          }
          title={'Settings'}
          animatedStyle={animatedHeaderStyle}
          onHeightChange={handleHeightChange}
          isDark={true}
          headerRight={null}
          isScrollCollapsible={false}
        />
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{
            paddingTop: insets.top + 70, // Increased for header space
            paddingBottom: insets.bottom + 80,
          }}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#93c5fd" />
          }>
          {/* Header Section */}
          <View className="mb-8">
            <Text className="mb-2 text-2xl font-bold text-white">Settings</Text>
            <Text className="text-sm leading-6 text-gray-400">
              Manage your settings and preferences.
            </Text>
          </View>

          {/* Hardcoded Video Display */}
          <View className="mb-8 overflow-hidden rounded-lg bg-black border border-red" style={{ width: width - 32 }}>
            <VideoView
              player={player}
              style={{
                width: width - 32,
                height: (width - 32) * (9 / 16), // 16:9 aspect ratio
              }}
              contentFit="cover"
              allowsPictureInPicture={false}
              nativeControls={false}
            />
            
            {/* Video Area - Tap to toggle controls (doesn't control playback) */}
            {!isVideoLoading && (
              <>
                {/* Background overlay for visual feedback when controls are shown */}
                {showControls && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: videoDuration > 0 ? 60 : 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    }}
                  />
                )}

                {/* Video tap area - only toggles controls visibility */}
                <TouchableOpacity
                  onPress={toggleControls}
                  activeOpacity={1}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: videoDuration > 0 ? 60 : 0,
                  }}
                />

                {/* Play/Pause Button - Only controls playback */}
                {showControls && (
                  <TouchableOpacity
                    onPress={togglePlayPause}
                    activeOpacity={0.8}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: videoDuration > 0 ? 60 : 0,
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 10,
                    }}>
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 2,
                        borderColor: 'rgba(255, 255, 255, 0.8)',
                      }}>
                      {isPlaying ? (
                        <Pause size={32} color="#ffffff" fill="#ffffff" />
                      ) : (
                        <Play size={32} color="#ffffff" fill="#ffffff" />
                      )}
                    </View>
                  </TouchableOpacity>
                )}

                {/* Progress Bar and Time Controls - Only show when controls are visible */}
                {videoDuration > 0 && showControls && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 60,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      paddingHorizontal: 12,
                      justifyContent: 'center',
                    }}>
                    {/* Progress Bar */}
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={(e) => {
                        handleSeek(e);
                        // Auto-hide after seeking
                        setTimeout(() => {
                          setShowControls(false);
                        }, 300);
                      }}
                      style={{
                        height: 4,
                        width: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        marginBottom: 8,
                      }}>
                      {/* Buffered Progress (lighter background) */}
                      <View
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: `${bufferedProgress}%`,
                          height: '100%',
                          backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        }}
                      />
                      {/* Current Progress */}
                      <View
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: `${currentProgress}%`,
                          height: '100%',
                          backgroundColor: '#93c5fd',
                        }}
                      />
                    </TouchableOpacity>

                    {/* Time Display */}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                      <Text className="text-xs text-gray-300">
                        {formatTime(currentTime)}
                      </Text>
                      <Text className="text-xs text-gray-400">
                        {formatTime(videoDuration)}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Loading Overlay with Progress */}
            {isVideoLoading && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <ActivityIndicator size="large" color="#93c5fd" />
                <Text className="mt-4 text-sm text-gray-300">
                  Loading video...
                </Text>
                {bufferedProgress > 0 && (
                  <View
                    style={{
                      width: width - 64,
                      height: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: 2,
                      marginTop: 12,
                      overflow: 'hidden',
                    }}>
                    <View
                      style={{
                        width: `${bufferedProgress}%`,
                        height: '100%',
                        backgroundColor: '#93c5fd',
                      }}
                    />
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}
