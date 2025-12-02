import { Stack } from 'expo-router';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollHeader } from '../../../hooks/useScrollHeader';
import { CollapsibleHeader } from '../../../components/CollapsibleHeader';
import { Bookmark } from 'lucide-react-native';
import { useState } from 'react';

export default function ClientBookmark() {
  const insets = useSafeAreaInsets();
  const { animatedHeaderStyle, onScroll, handleHeightChange } = useScrollHeader();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Add your refresh logic here (e.g., refetch bookmarks)
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing bookmarks:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Dummy bookmarked items
  const bookmarkedItems = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    title: `Bookmarked Project ${i + 1}`,
    description: `This is a bookmarked project saved for later review.`,
    type: i % 2 === 0 ? 'Project' : 'Talent',
  }));

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <CollapsibleHeader
          title="Bookmarks"
          animatedStyle={animatedHeaderStyle}
          onHeightChange={handleHeightChange}
          isDark={true}
        />
        <ScrollView
          style={styles.scrollView}
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
              colors={['#3b82f6']}
            />
          }
          contentContainerStyle={{
            paddingTop: insets.top + 72,
            paddingBottom: 20,
            paddingHorizontal: 24,
          }}
        >
          <View style={styles.header}>
            <Bookmark color="#ffffff" size={28} />
            <Text style={styles.headerText}>Your Saved Items</Text>
          </View>
          
          {bookmarkedItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.bookmarkItem}>
              <View style={styles.bookmarkHeader}>
                <Text style={styles.bookmarkType}>{item.type}</Text>
              </View>
              <Text style={styles.bookmarkTitle}>{item.title}</Text>
              <Text style={styles.bookmarkDescription}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    paddingTop: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  bookmarkItem: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bookmarkHeader: {
    marginBottom: 8,
  },
  bookmarkType: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  bookmarkTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  bookmarkDescription: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
});
