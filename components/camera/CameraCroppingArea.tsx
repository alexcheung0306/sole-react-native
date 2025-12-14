import { Image as ExpoImage } from 'expo-image';
import { ImageIcon, VideoIcon, Layers } from "lucide-react-native";
import { View, FlatList, TouchableOpacity, Text } from "react-native";
import { MediaItem } from "~/context/CameraContext";
import CropControls from "./CropControls";
import MainMedia from "./MainMedia";

export const CameraCroppingArea = ({
    previewItem,
    selectedMedia,
    currentIndex,
    width,
    selectedAspectRatio,
    setSelectedAspectRatio,
    setCurrentIndex,
    multipleSelection,
    setIsMultiSelect,
    isMultiSelect,
    isAspectRatioLocked,
    mask,
}: any) => {
    if (!previewItem) return null;

    if (selectedMedia.length > 0) {
        return (
            <View>
                {/* Main Media Display (Editable) */}
                <MainMedia
                    currentIndex={currentIndex}
                    width={width}
                    selectedAspectRatio={selectedAspectRatio}
                    mask={mask}
                />


                <View style={{  }} className="bg-red  ">
                    <CropControls
                        selectedAspectRatio={selectedAspectRatio}
                        setSelectedAspectRatio={setSelectedAspectRatio}
                        currentIndex={currentIndex}
                        setCurrentIndex={setCurrentIndex}
                        multipleSelection={multipleSelection}
                        setIsMultiSelect={setIsMultiSelect}
                        isMultiSelect={isMultiSelect}
                        isAspectRatioLocked={isAspectRatioLocked}
                    />
                </View>

                {/* Thumbnail Strip (only if multiple selected) */}
                {selectedMedia.length > 1 && (
                    <View className="bg-black px-4 py-3">
                        <Text className="mb-2 text-sm text-gray-400">Selected ({selectedMedia.length})</Text>
                        <FlatList
                            data={selectedMedia}
                            renderItem={({ item, index }: { item: MediaItem; index: number }) => (
                                <TouchableOpacity
                                    onPress={() => setCurrentIndex(index)}
                                    className={`mr-2 ${currentIndex === index ? 'border-2 border-blue-500' : 'border border-gray-600'} overflow-hidden rounded-lg`}
                                    style={{ width: 60, height: 60 }}>
                                    <ExpoImage
                                        source={{ uri: item.uri }}
                                        style={{ width: 60, height: 60 }}
                                        contentFit="cover"
                                    />
                                    {item.mediaType === 'video' && (
                                        <View className="absolute inset-0 items-center justify-center bg-black/30">
                                            <ImageIcon size={16} color="#ffffff" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            )}
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                        />
                    </View>
                )}
            </View>
        );
    }

    return (
        <View style={{ width, height: width, borderWidth: 1, borderColor: 'red' }} className="relative bg-black">
            <ExpoImage
                source={previewItem.uri}
                style={{
                    width,
                    height: width,
                    borderRadius: mask === 'circle' ? width / 2 : 0,
                }}
                contentFit="cover"
            />

            {previewItem.mediaType === 'video' && (
                <View className="absolute inset-0 items-center justify-center bg-black/30">
                    <VideoIcon size={48} color="#ffffff" />
                </View>
            )}

            {/* Multi-select toggle button */}
            {multipleSelection === 'true' && (
                <TouchableOpacity
                    onPress={() => {
                        setIsMultiSelect(!isMultiSelect);
                        // If switching to single mode, keep only the last selected item
                        if (isMultiSelect && selectedMedia.length > 1) {
                            const lastItem = selectedMedia[selectedMedia.length - 1];
                            // setSelectedMedia([lastItem]);
                            setCurrentIndex(0);
                        }
                    }}
                    style={{
                        position: 'absolute',
                        right: 12,
                        bottom: 12,
                        backgroundColor: isMultiSelect ? 'rgb(0, 140, 255)' : 'rgba(0,0,0,0.6)',
                        borderRadius: 20,
                        padding: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                    }}>
                    <Layers size={12} color="#ffffff" />
                </TouchableOpacity>
            )}
        </View>
    );
};