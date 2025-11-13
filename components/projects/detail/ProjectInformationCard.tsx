import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type ProjectInformationCardProps = {
  project: any;
};

export function ProjectInformationCard({ project }: ProjectInformationCardProps) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Project Overview</Text>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Description</Text>
        <Text style={styles.infoValue}>
          {project?.projectDescription || 'No description provided.'}
        </Text>
      </View>

      {project?.usage ? (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Usage</Text>
          <Text style={styles.infoValue}>{project.usage}</Text>
        </View>
      ) : null}

      {project?.remarks ? (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Remarks</Text>
          <Text style={styles.infoValue}>{project.remarks}</Text>
        </View>
      ) : null}

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Private Project</Text>
        <Text style={styles.infoValue}>{project?.isPrivate ? 'Yes' : 'No'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoLabel: {
    color: 'rgba(229, 231, 235, 0.65)',
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: '#f9fafb',
    fontSize: 16,
    lineHeight: 22,
  },
});


