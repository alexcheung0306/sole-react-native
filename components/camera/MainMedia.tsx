import { View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { MediaItem, useCameraContext } from '~/context/CreatePostContext';
import { EditableImage } from '~/components/camera/EditableImage';

export default function MainMedia({
  currentIndex,
  width,
  selectedAspectRatio,
}: {
  currentIndex: number;
  width: number;
  selectedAspectRatio: number;
}) {
  const { selectedMedia, setSelectedMedia } = useCameraContext();
  if (selectedMedia.length === 0 || !selectedMedia[currentIndex]) {
    return null;
  }

  const item = selectedMedia[currentIndex];
  // Fixed container aspect ratio (4:5)
  const FIXED_RATIO = 4 / 5;
  const fixedContainerHeight = width / FIXED_RATIO;
  const getAspectRatioValue = (item: MediaItem) => {
    if (selectedAspectRatio === -1) {
      // Calculate natural aspect ratio
      const w = item.cropData?.naturalWidth ?? item.width ?? 1;
      const h = item.cropData?.naturalHeight ?? item.height ?? 1;
      return w / h;
    }
    return selectedAspectRatio;
  };
  // Calculate dimensions for the EditableImage based on selected aspect ratio
  // fitting inside the fixed container (contain)
  const targetRatio = getAspectRatioValue(item);

  let renderWidth = width;
  let renderHeight = width / targetRatio;

  if (renderHeight > fixedContainerHeight) {
    renderHeight = fixedContainerHeight;
    renderWidth = renderHeight * targetRatio;
  }

  const handleCropUpdate = (cropData: any) => {
    const updated = selectedMedia.map((item, index) => {
      if (index !== currentIndex) return item;

      return {
        ...item,
        cropData,
        // We don't update URI here because we are just updating the crop metadata
        // The final crop will be applied when saving/posting
      };
    });

    setSelectedMedia(updated);
  };

  return (
    <View
      style={{ width, height: fixedContainerHeight }}
      className="relative items-center justify-center overflow-hidden bg-black">
      {item.mediaType === 'video' ? (
        <Video
          source={{ uri: item.uri }}
          style={{ width: renderWidth, height: renderHeight }}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          useNativeControls
        />
      ) : (
        <View style={{ width: renderWidth, height: renderHeight, overflow: 'hidden' }}>
          <EditableImage
            uri={item.originalUri ?? item.uri}
            containerWidth={renderWidth}
            containerHeight={renderHeight}
            naturalWidth={item.cropData?.naturalWidth ?? item.width ?? 1000}
            naturalHeight={item.cropData?.naturalHeight ?? item.height ?? 1000}
            cropData={item.cropData}
            onUpdate={handleCropUpdate}
          />
        </View>
      )}
    </View>
  );
}
