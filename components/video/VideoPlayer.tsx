import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Play, Pause } from 'lucide-react-native';

interface VideoPlayerProps {
  uri: string;
  width?: number;
  height?: number;
  aspectRatio?: number; // Optional aspect ratio (width/height), used if width/height not provided
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  showControls?: boolean;
  className?: string;
  style?: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function VideoPlayer({
  uri,
  width,
  height,
  aspectRatio,
  autoPlay = false,
  loop = true,
  muted = true,
  showControls: initialShowControls = true,
  className = '',
  style,
}: VideoPlayerProps) {
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [bufferedProgress, setBufferedProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [showControls, setShowControls] = useState(initialShowControls);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [detectedAspectRatio, setDetectedAspectRatio] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);

  const containerWidth = width || SCREEN_WIDTH;
  
  // Calculate height based on priority:
  // 1. Explicit height prop
  // 2. Explicit aspectRatio prop with width
  // 3. Detected aspect ratio from video
  // 4. Default 16:9
  let containerHeight: number;
  if (height) {
    containerHeight = height;
  } else if (aspectRatio) {
    containerHeight = containerWidth / aspectRatio;
  } else if (detectedAspectRatio) {
    containerHeight = containerWidth / detectedAspectRatio;
  } else {
    containerHeight = containerWidth / (16 / 9); // Default 16:9
  }

  // Log video URI for debugging
  useEffect(() => {
    console.log('[VideoPlayer] Loading video from URI:', uri.substring(0, 100) + '...');
  }, [uri]);

  const player = useVideoPlayer(uri, (player) => {
    player.loop = loop;
    player.muted = muted;
    
    // Add error handler - expo-video status values: 'idle' | 'loading' | 'error'
    try {
      const subscription = player.addListener('statusChange', (status: any) => {
        console.log('[VideoPlayer] Status changed:', status?.status || status);
        if (status?.status === 'error' || status === 'error') {
          console.error('[VideoPlayer] Error status:', status);
          setHasError(true);
          setIsVideoLoading(false);
        } else if (status?.status === 'idle' && player.duration > 0) {
          console.log('[VideoPlayer] Video ready (idle with duration)');
          setIsVideoLoading(false);
          setHasError(false);
        }
      });
      
      // Note: expo-video listener cleanup is handled automatically
    } catch (error) {
      console.warn('[VideoPlayer] Could not add status listener:', error);
    }
  });

  // Monitor video loading and buffering status
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const checkStatus = () => {
      try {
        const duration = player.duration;
        const currentTime = player.currentTime;
        const status = player.status;
        const playing = player.playing;
        
        // Check for error status
        if (status === 'error') {
          console.error('Video player error status detected');
          setHasError(true);
          setIsVideoLoading(false);
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
          return;
        }
        
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
            setHasError(false);
          } else if (status === 'loading') {
            setIsVideoLoading(true);
          }
        } else {
          // Still loading metadata
          setIsVideoLoading(true);
        }
      } catch (error) {
        console.warn('Video status check error:', error);
        setHasError(true);
        setIsVideoLoading(false);
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }
    };
    
    // Add timeout for loading (30 seconds)
    const loadingTimeout = setTimeout(() => {
      if (isVideoLoading && player.duration === 0) {
        console.warn('[VideoPlayer] Loading timeout after 30s - URI:', uri.substring(0, 100));
        console.warn('[VideoPlayer] Player status:', player.status);
        setHasError(true);
        setIsVideoLoading(false);
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }
    }, 30000);

    if (autoPlay) {
      player.play();
    }

    // Check status periodically (every 200ms)
    interval = setInterval(checkStatus, 200);
    checkStatus();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      clearTimeout(loadingTimeout);
    };
  }, [player, autoPlay, containerWidth, uri]);

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
    const progressBarWidth = containerWidth - 56; // Account for padding
    const seekPercentage = Math.max(0, Math.min(1, locationX / progressBarWidth));
    const seekTime = seekPercentage * videoDuration;
    
    player.currentTime = seekTime;
    setCurrentProgress(seekPercentage * 100);
    setCurrentTime(seekTime);
  }, [videoDuration, player, containerWidth]);

  return (
    <View
      className={`overflow-hidden rounded-lg bg-black ${className}`}
      style={[{ width: containerWidth, height: containerHeight }, style]}>
      <VideoView
        player={player}
        style={{
          width: containerWidth,
          height: containerHeight,
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
      {isVideoLoading && !hasError && (
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
                width: containerWidth - 64,
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

      {/* Error Overlay */}
      {hasError && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Text className="text-sm text-red-400 mb-2">
            Failed to load video
          </Text>
          <Text className="text-xs text-gray-400 text-center px-4">
            The video may be unavailable or the format is not supported
          </Text>
        </View>
      )}
    </View>
  );
}

