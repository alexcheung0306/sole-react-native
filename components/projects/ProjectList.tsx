import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { formatDateTime } from '@/utils/time-converts';
import { getStatusColor } from '@/utils/get-status-color';

interface ProjectListProps {
  projects: any[];
  isLoading: boolean;
  error: any;
}

export default function ProjectList({
  projects,
  isLoading,
  error,
}: ProjectListProps) {
  const router = useRouter();

  const handleProjectPress = (projectId: number) => {
    router.push({
      pathname: `/(protected)/project-detail/${projectId}` as any,
    });
  };

  const getStatusColorValue = (status: string) => {
    const colorMap: { [key: string]: string } = {
      Draft: '#6b7280',
      Published: '#f59e0b',
      InProgress: '#10b981',
      Completed: '#3b82f6',
    };
    return colorMap[status] || '#6b7280';
  };

  const renderProject = ({ item }: { item: any }) => {
    // Handle both nested and flat project structures
    const project = item?.project || item;
    
    if (!project) {
      console.warn('Invalid project item:', item);
      return null;
    }
    
    const statusColor = getStatusColorValue(project.status || 'Draft');

    return (
      <TouchableOpacity
        style={styles.projectCard}
        onPress={() => handleProjectPress(project.id)}
      >
        {/* Project Image */}
        {project.projectImage ? (
          <Image
            source={{ uri: project.projectImage }}
            style={styles.projectImage}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>No Image</Text>
          </View>
        )}

        {/* Project Info */}
        <View style={styles.projectInfo}>
          <View style={styles.projectHeader}>
            <Text style={styles.projectId}>#{project.id}</Text>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor + '33' }]}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {project.status}
              </Text>
            </View>
          </View>

          <Text style={styles.projectName} numberOfLines={2}>
            {project.projectName}
          </Text>

          <Text style={styles.projectDescription} numberOfLines={2}>
            {project.projectDescription}
          </Text>

          <View style={styles.projectFooter}>
            <Text style={styles.timestamp}>
              Updated: {formatDateTime(project.updatedAt)}
            </Text>
            {project.applicationDeadline && (
              <Text style={styles.deadline}>
                Deadline: {formatDateTime(project.applicationDeadline)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading projects</Text>
        <Text style={styles.errorDetail}>
          {error?.message || 'Failed to load projects'}
        </Text>
        <Text style={styles.errorHint}>
          Please check your network connection and try again
        </Text>
      </View>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No projects found</Text>
        <Text style={styles.emptySubtext}>Create your first project to get started</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={projects}
      renderItem={renderProject}
      keyExtractor={(item) => (item.project?.id || item.id).toString()}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
  },
  projectCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  projectImage: {
    width: 120,
    height: 120,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(107, 114, 128, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#6b7280',
    fontSize: 12,
  },
  projectInfo: {
    flex: 1,
    padding: 12,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  projectDescription: {
    fontSize: 13,
    color: '#d1d5db',
    marginBottom: 8,
    lineHeight: 18,
  },
  projectFooter: {
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#9ca3af',
  },
  deadline: {
    fontSize: 11,
    color: '#f59e0b',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorDetail: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHint: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
});

