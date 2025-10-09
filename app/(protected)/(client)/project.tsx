import { Stack } from 'expo-router';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollHeader } from '../../../hooks/useScrollHeader';
import { CollapsibleHeader } from '../../../components/CollapsibleHeader';
import { FolderKanban, Plus } from 'lucide-react-native';

export default function ClientProject() {
  const insets = useSafeAreaInsets();
  const { headerTranslateY, handleScroll } = useScrollHeader();

  // Dummy projects
  const projects = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    title: `Project ${i + 1}`,
    description: `This is a client project description for project ${i + 1}.`,
    status: i % 3 === 0 ? 'Active' : i % 3 === 1 ? 'In Progress' : 'Completed',
    applicants: Math.floor(Math.random() * 20) + 1,
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return '#10b981';
      case 'In Progress':
        return '#3b82f6';
      case 'Completed':
        return '#6b7280';
      default:
        return '#ffffff';
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <CollapsibleHeader
          title="Projects"
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
          <TouchableOpacity style={styles.createButton}>
            <Plus color="#ffffff" size={24} />
            <Text style={styles.createButtonText}>Create New Project</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Your Projects</Text>
          
          {projects.map((project) => (
            <TouchableOpacity key={project.id} style={styles.projectItem}>
              <View style={styles.projectHeader}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) + '33' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(project.status) }]}>
                    {project.status}
                  </Text>
                </View>
                <Text style={styles.applicantCount}>{project.applicants} applicants</Text>
              </View>
              <Text style={styles.projectTitle}>{project.title}</Text>
              <Text style={styles.projectDescription}>{project.description}</Text>
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  projectItem: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  applicantCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  projectDescription: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
});
