import React from 'react';
import { View, Animated, Text, StyleSheet } from 'react-native';
import { CollapsibleHeader } from '../components/CollapsibleHeader';
import { useScrollHeader } from '../hooks/useScrollHeader';

export const CollapsibleHeaderExample = () => {
  const { headerTranslateY, scrollY, animatedScrollHandler, handleHeightChange } = useScrollHeader();

  return (
    <View style={styles.container}>
      <CollapsibleHeader
        title="Collapsible Header"
        translateY={headerTranslateY}
        onHeightChange={handleHeightChange}
      />

      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={animatedScrollHandler}
        scrollEventThrottle={16}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Scroll to see header behavior</Text>
          {Array.from({ length: 50 }, (_, i) => (
            <Text key={i} style={styles.item}>
              Item {i + 1}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 100, // Space for header
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  item: {
    fontSize: 16,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
