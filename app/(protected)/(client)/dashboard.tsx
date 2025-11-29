import React from 'react';
import { Stack, Link } from 'expo-router';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { ScreenContent } from '../../../components/ScreenContent';
import { Button, ButtonText } from '~/components/ui/button';
import { useScrollHeader } from '../../../hooks/useScrollHeader';
import { CollapsibleHeader } from '../../../components/CollapsibleHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderButton } from '../../../components/HeaderButton';

export default React.memo(function ClientDashboard() {
  const insets = useSafeAreaInsets();
  const { headerTranslateY, handleScroll } = useScrollHeader();

  // Create some dummy content to make it scrollable
  const dummyContent = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    title: `Dashboard Item ${i + 1}`,
    description: `This is a sample dashboard content item to demonstrate the collapsible header functionality.`,
  }));

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <CollapsibleHeader
          title="Dashboard"
          headerRight={
            <Link href="/(protected)/chat" asChild>
              <HeaderButton />
            </Link>
          }
          translateY={headerTranslateY}
          isDark={true}
        />
        <ScrollView 
          style={styles.scrollView}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingTop: insets.top + 72, // Increased to account for larger header
            paddingBottom: 20,
          }}
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Client Dashboard</Text>
            <Text style={styles.welcomeSubtitle}>Manage your client activities</Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Create Project</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Browse Jobs</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Content */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client Activity</Text>
            {dummyContent.slice(0, 5).map((item) => (
              <View key={item.id} style={styles.contentItem}>
                <Text style={styles.contentTitle}>{item.title}</Text>
                <Text style={styles.contentDescription}>{item.description}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#d1d5db',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  contentItem: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#ffffff',
  },
  contentDescription: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
});
