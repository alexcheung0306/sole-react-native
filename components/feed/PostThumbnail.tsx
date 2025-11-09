import { View, Image, TouchableOpacity, Dimensions, Text } from 'react-native';
import { Image as MultipleImages, Heart, MessageCircle } from 'lucide-react-native';
import { useState } from 'react';

interface PostThumbnailProps {
  imageUrl: string;
  hasMultipleImages: boolean;
  onPress: () => void;
  likeCount?: number;
  commentCount?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMNS = SCREEN_WIDTH < 768 ? 2 : 3; // 2 columns on phones, 3 on tablets
const GAP = 4;
const THUMBNAIL_SIZE = (SCREEN_WIDTH - (GAP * (COLUMNS + 1))) / COLUMNS;

export function PostThumbnail({ 
  imageUrl, 
  hasMultipleImages, 
  onPress, 
  likeCount = 0, 
  commentCount = 0 
}: PostThumbnailProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{ 
        width: THUMBNAIL_SIZE, 
        height: THUMBNAIL_SIZE, 
        margin: GAP / 2,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      {/* Image Container */}
      <View style={{ flex: 1, position: 'relative' }}>
        <Image
          source={{ uri: imageUrl }}
          style={{ 
            width: '100%', 
            height: '100%',
            opacity: imageLoaded ? 1 : 0,
          }}
          resizeMode="cover"
          onLoad={() => setImageLoaded(true)}
        />

        {/* Loading placeholder */}
        {!imageLoaded && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#1f2937',
          }} />
        )}

        {/* Gradient overlay for better text visibility */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
        }} />

        {/* Multiple Images Indicator */}
        {hasMultipleImages && (
          <View style={{
            position: 'absolute',
            top: 12,
            right: 12,
          }}>
            <View style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderRadius: 9999,
            }}>
              <MultipleImages size={12} color="#ffffff" />
            </View>
          </View>
        )}

        {/* Engagement Stats */}
        {(likeCount > 0 || commentCount > 0) && (
          <View style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              {likeCount > 0 && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 9999,
                }}>
                  <Heart size={10} color="#ef4444" fill="#ef4444" />
                  <Text style={{
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: '500',
                    marginLeft: 4,
                  }}>
                    {likeCount}
                  </Text>
                </View>
              )}
              
              {commentCount > 0 && (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 9999,
                }}>
                  <MessageCircle size={10} color="#3b82f6" />
                  <Text style={{
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: '500',
                    marginLeft: 4,
                  }}>
                    {commentCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export { THUMBNAIL_SIZE, COLUMNS };

