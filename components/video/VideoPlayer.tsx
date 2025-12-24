import { useEffect, useRef, useState } from 'react';
import { View, Dimensions, StyleProp, ViewStyle } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEvent } from 'expo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VideoPlayerProps {
  uri: string;
  loop?: boolean;
  muted?: boolean;
  showControls?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  videoHeight?: number;
}

export function VideoPlayer({
  uri,
  loop = true,
  muted = true,
  showControls: initialShowControls = true,
  className = '',
  style,
  videoHeight,
}: VideoPlayerProps) {
  const containerWidth = SCREEN_WIDTH;

  const player = useVideoPlayer(uri, (player) => {
    player.loop = loop;
    player.muted = muted;
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { videoTrack } = useEvent(player, 'videoTrackChange', {
    videoTrack: player.videoTrack,
  });

  // Monitor video playback state - log when video starts playing
  const wasPlayingRef = useRef(false);
  useEffect(() => {
    const checkPlayingState = () => {
      const isPlaying = player.playing;
      const wasPlaying = wasPlayingRef.current;

      if (isPlaying && !wasPlaying) {
        // Video just started playing
        console.log('[VideoPlayer] 🎬 Video started playing');
        console.log('[VideoPlayer] Current time:', player.currentTime);
        console.log('[VideoPlayer] Duration:', player.duration);
        console.log('[VideoPlayer] Status:', player.status);

        if (videoTrack) {
          console.log('[VideoPlayer] videoTrack', JSON.stringify(videoTrack, null, 2));
        }
      } else if (!isPlaying && wasPlaying) {
        // Video just paused/stopped
        console.log('[VideoPlayer] ⏸️ Video paused/stopped');
      }
      wasPlayingRef.current = isPlaying;
    };

    // Check immediately
    checkPlayingState();

    // Poll every 100ms to detect state changes
    const interval = setInterval(checkPlayingState, 100);

    return () => clearInterval(interval);
  }, [player, videoTrack]);

  // Calculate video height based on aspect ratio
  return (
    <View
      className={`overflow-auto rounded-lg bg-black ${className}`}
      style={[
        {
          width: containerWidth,
          height: videoHeight || containerWidth,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}>
      <VideoView
        player={player}
        style={{
          width: containerWidth,
          height: videoHeight || containerWidth,
    
        }}
        contentFit="contain"
        allowsPictureInPicture={false}
        nativeControls={true}
      />
    </View>
  );
}
