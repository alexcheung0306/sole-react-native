import { View, StyleSheet } from 'react-native';
import { useJobTabContext } from '@/context/JobTabContext';
import JobPosts from './job-posts';
import AppliedRoles from './applied-roles';
import MyContracts from './my-contracts';

export default function JobIndex() {
  const { activeTab } = useJobTabContext();

  return (
    <View style={styles.container}>
      <View style={[styles.tabContent, activeTab !== 'job-posts' && styles.hidden]}>
        <JobPosts />
      </View>
      <View style={[styles.tabContent, activeTab !== 'applied-roles' && styles.hidden]}>
        <AppliedRoles />
      </View>
      <View style={[styles.tabContent, activeTab !== 'my-contracts' && styles.hidden]}>
        <MyContracts />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
    opacity: 0,
    pointerEvents: 'none',
  },
});
