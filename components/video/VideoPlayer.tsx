import { useEffect, useRef, useState } from 'react';
import { View, Dimensions } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEvent } from 'expo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function VideoPlayer({
  uri,
  loop = true,
  muted = true,
  showControls: initialShowControls = true,
  className = '',
  style,
  onHeightChange,
}: any) {
  const containerWidth = SCREEN_WIDTH;
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);

  // Log video URI for debugging
  useEffect(() => {
    console.log('[VideoPlayer] Loading video from URI:', uri.substring(0, 100) + '...');
  }, [uri]);

  const player = useVideoPlayer(uri, (player) => {
    player.loop = loop;
    player.muted = muted;
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { videoTrack } = useEvent(player, 'videoTrackChange', {
    videoTrack: player.videoTrack,
  });

  // Calculate aspect ratio when video track becomes available (for VideoPlayer internal use)
  useEffect(() => {
    if (videoTrack && videoTrack.size) {
      const { width, height } = videoTrack.size;
      const aspectRatio = width / height;
      const aspectRatioString = `${width}:${height} (${aspectRatio.toFixed(2)}:1)`;
      console.log('[VideoPlayer] 📐 Aspect ratio:', aspectRatioString);

      // Store aspect ratio for dynamic sizing
      setVideoAspectRatio(aspectRatio);
    }
  }, [videoTrack]);

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

          // Notify parent of height change when video starts playing
          if (videoAspectRatio) {
            const calculatedHeight = containerWidth / videoAspectRatio;
            console.log('[VideoPlayer] Notifying parent of height change on play:', calculatedHeight);
            onHeightChange?.(calculatedHeight);
          }
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
  const videoHeight = videoAspectRatio ? containerWidth / videoAspectRatio : containerWidth;
console.log('videoHeight',videoAspectRatio,containerWidth, videoHeight);
  return (
    <View
      className={`overflow-auto rounded-lg bg-black ${className}`}
      style={[
        {
          width: containerWidth,
          height: videoHeight,
          borderWidth: 1,
          borderColor: 'yellow',
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
          height: videoHeight,
    
        }}
        contentFit="contain"
        allowsPictureInPicture={false}
        nativeControls={false}
      />
    </View>
  );
}
