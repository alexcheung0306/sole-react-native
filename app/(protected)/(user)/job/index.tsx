import { View, StyleSheet } from 'react-native';
import { useJobTabContext } from '@/context/JobTabContext';
import JobPosts from './job-posts';
import AppliedRoles from './applied-roles';
import MyContracts from './my-contracts';
import ScreenTransition from '@/components/projects/ScreenTransition';

export default function JobIndex() {
  const { activeTab } = useJobTabContext();

  return (
    <View style={styles.container}>
      <View style={[styles.tabContent, activeTab !== 'job-posts' && styles.hidden]}>
        <ScreenTransition direction="left" isActive={activeTab === 'job-posts'}>
          <JobPosts />
        </ScreenTransition>
      </View>
      <View style={[styles.tabContent, activeTab !== 'applied-roles' && styles.hidden]}>
        <ScreenTransition direction="left" isActive={activeTab === 'applied-roles'}>
          <AppliedRoles />
        </ScreenTransition>
      </View>
      <View style={[styles.tabContent, activeTab !== 'my-contracts' && styles.hidden]}>
        <ScreenTransition direction="right" isActive={activeTab === 'my-contracts'}>
          <MyContracts />
        </ScreenTransition>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  tabContent: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hidden: {
    pointerEvents: 'none',
    // Opacity is handled by ScreenTransition component
  },
});
