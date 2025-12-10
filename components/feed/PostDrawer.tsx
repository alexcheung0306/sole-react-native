import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import CollapseDrawer from '~/components/custom/collapse-drawer';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { Post } from '~/types/post';
import { deletePost } from '~/api/apiservice/post_api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface PostDrawerProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

export function PostDrawer({ post, isOpen, onClose }: PostDrawerProps) {
  const { soleUserId } = useSoleUserContext();
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const isCreator = post.soleUserId === soleUserId;

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: () => deletePost(Number(post.id)),
    onSuccess: () => {
      // Invalidate queries to refresh the post list
      queryClient.invalidateQueries({ queryKey: ['homePagePosts'] });
      queryClient.invalidateQueries({ queryKey: ['profilePagePosts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      // Close drawer
      onClose();
    },
    onError: (error) => {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete post. Please try again.');
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePostMutation.mutate();
          },
        },
      ]
    );
  };

  const handleReport = () => {
    // TODO: Implement report functionality
    Alert.alert('Report', 'Report functionality coming soon');
    onClose();
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    Alert.alert('Edit', 'Edit functionality coming soon');
    onClose();
  };

  return (
    <>
      <CollapseDrawer showDrawer={isOpen} setShowDrawer={onClose} autoHeight>
        <View style={styles.drawerContent}>
          {/* Report - Only for non-creator */}
          {!isCreator && (
            <TouchableOpacity
              style={styles.drawerItem}
              onPress={handleReport}
              activeOpacity={0.7}>
              <Text style={styles.drawerItemText}>Report</Text>
            </TouchableOpacity>
          )}

          {/* Edit - Only for creator */}
          {isCreator && (
            <TouchableOpacity
              style={styles.drawerItem}
              onPress={handleEdit}
              activeOpacity={0.7}>
              <Text style={styles.drawerItemText}>Edit</Text>
            </TouchableOpacity>
          )}

          {/* Delete - Only for creator */}
          {isCreator && (
            <TouchableOpacity
              style={[styles.drawerItem, styles.deleteItem]}
              onPress={handleDelete}
              activeOpacity={0.7}
              disabled={deletePostMutation.isPending}>
              <Text style={[styles.drawerItemText, styles.deleteText]}>
                {deletePostMutation.isPending ? 'Deleting...' : 'Delete'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </CollapseDrawer>
    </>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    padding: 20,
  },
  drawerItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  drawerItemText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  deleteItem: {
    borderBottomWidth: 0,
  },
  deleteText: {
    color: '#ef4444',
  },
});

