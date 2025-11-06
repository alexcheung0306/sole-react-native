import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import { 
  X, 
  FlipHorizontal, 
  Zap, 
  ZapOff, 
  Circle, 
  Square,
  Pause,
  Play,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CameraCaptureProps {
  onClose: () => void;
  onMediaCaptured: (uri: string, type: 'photo' | 'video') => void;
  mode: 'photo' | 'video';
}

export function CameraCapture({ onClose, onMediaCaptured, mode }: CameraCaptureProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();

  const MAX_DURATION = 60; // 60 seconds max

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, []);

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6" style={{ paddingTop: insets.top }}>
        <Text className="text-white text-xl mb-4">Camera Permission Required</Text>
        <Text className="text-gray-400 text-center mb-6">
          We need camera access to let you take photos and videos
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-blue-500 rounded-lg px-6 py-3"
        >
          <Text className="text-white font-semibold">Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} className="mt-4">
          <Text className="text-gray-400">Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash((current) => (current === 'off' ? 'on' : 'off'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        if (photo?.uri) {
          onMediaCaptured(photo.uri, 'photo');
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        setIsRecording(true);
        setRecordingTime(0);

        // Start timer
        recordingInterval.current = setInterval(() => {
          setRecordingTime((prev) => {
            if (prev >= MAX_DURATION) {
              stopRecording();
              return prev;
            }
            return prev + 1;
          });
        }, 1000);

        const video = await cameraRef.current.recordAsync({
          maxDuration: MAX_DURATION,
        });

        if (video?.uri) {
          onMediaCaptured(video.uri, 'video');
        }
      } catch (error) {
        console.error('Error recording video:', error);
        Alert.alert('Error', 'Failed to record video');
      } finally {
        setIsRecording(false);
        if (recordingInterval.current) {
          clearInterval(recordingInterval.current);
        }
      }
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      try {
        await cameraRef.current.stopRecording();
        setIsRecording(false);
        if (recordingInterval.current) {
          clearInterval(recordingInterval.current);
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    }
  };

  const pauseResumeRecording = () => {
    // Note: Expo Camera doesn't support pause/resume natively
    // This is a UI placeholder - would need custom implementation
    setIsPaused(!isPaused);
    Alert.alert('Feature Coming Soon', 'Pause/Resume recording will be available soon');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
      >
        {/* Top Controls */}
        <View 
          className="absolute left-0 right-0 flex-row items-center justify-between px-4"
          style={{ top: insets.top + 10 }}
        >
          <TouchableOpacity onPress={onClose} className="p-2 bg-black/50 rounded-full">
            <X size={24} color="#ffffff" />
          </TouchableOpacity>

          <View className="flex-row gap-3">
            <TouchableOpacity onPress={toggleFlash} className="p-2 bg-black/50 rounded-full">
              {flash === 'off' ? (
                <ZapOff size={24} color="#ffffff" />
              ) : (
                <Zap size={24} color="#fbbf24" />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleCameraFacing} className="p-2 bg-black/50 rounded-full">
              <FlipHorizontal size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recording Timer */}
        {isRecording && (
          <View 
            className="absolute left-0 right-0 items-center"
            style={{ top: insets.top + 70 }}
          >
            <View className="bg-red-500 rounded-full px-4 py-2 flex-row items-center">
              <View className="w-3 h-3 bg-white rounded-full mr-2 animate-pulse" />
              <Text className="text-white font-bold">{formatTime(recordingTime)}</Text>
            </View>
          </View>
        )}

        {/* Bottom Controls */}
        <View className="absolute bottom-0 left-0 right-0 pb-8 items-center">
          {/* Mode Indicator */}
          <Text className="text-white text-sm font-medium mb-4">
            {mode === 'photo' ? 'PHOTO' : 'VIDEO'}
          </Text>

          <View className="flex-row items-center justify-center w-full px-8">
            {/* Left spacer */}
            <View style={{ flex: 1 }} />

            {/* Capture Button */}
            <View style={{ alignItems: 'center' }}>
              {mode === 'photo' ? (
                <TouchableOpacity
                  onPress={takePicture}
                  className="w-20 h-20 rounded-full border-4 border-white items-center justify-center bg-transparent"
                >
                  <View className="w-16 h-16 rounded-full bg-white" />
                </TouchableOpacity>
              ) : (
                <>
                  {!isRecording ? (
                    <TouchableOpacity
                      onPress={startRecording}
                      className="w-20 h-20 rounded-full border-4 border-white items-center justify-center bg-transparent"
                    >
                      <View className="w-16 h-16 rounded-lg bg-red-500" />
                    </TouchableOpacity>
                  ) : (
                    <View className="items-center">
                      <TouchableOpacity
                        onPress={stopRecording}
                        className="w-20 h-20 rounded-full border-4 border-white items-center justify-center bg-transparent"
                      >
                        <Square size={32} color="#ffffff" fill="#ffffff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={pauseResumeRecording}
                        className="mt-4"
                      >
                        {isPaused ? (
                          <Play size={20} color="#ffffff" />
                        ) : (
                          <Pause size={20} color="#ffffff" />
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Right spacer */}
            <View style={{ flex: 1 }} />
          </View>
        </View>
      </CameraView>
    </View>
  );
}

