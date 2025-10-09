import { Stack } from 'expo-router';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollHeader } from '../../../hooks/useScrollHeader';
import { CollapsibleHeader } from '../../../components/CollapsibleHeader';
import { Bookmark } from 'lucide-react-native';

export default function ClientBookmark() {
  const insets = useSafeAreaInsets();
  const { headerTranslateY, handleScroll } = useScrollHeader();

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
          translateY={headerTranslateY}
          isDark={true}
        />
        <ScrollView 
          style={styles.scrollView}
          onScroll={handleScroll}
          scrollEventThrottle={16}
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
