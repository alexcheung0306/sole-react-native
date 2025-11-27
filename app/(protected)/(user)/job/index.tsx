import { useCallback } from 'react';
import { useJobTabContext } from '@/context/JobTabContext';
import JobPosts from './job-posts';
import AppliedRoles from './applied-roles';
import MyContracts from './my-contracts';
import JobSwipeableContainer from '@/components/job/JobSwipeableContainer';

// Map tab names to indices
const tabToIndex = {
  'job-posts': 0,
  'applied-roles': 1,
  'my-contracts': 2,
} as const;

export default function JobIndex() {
  const { activeTab, setActiveTab } = useJobTabContext();

  const activeIndex = tabToIndex[activeTab];

  return (
    <JobSwipeableContainer activeIndex={activeIndex}>
      <JobPosts />
      <AppliedRoles />
      <MyContracts />
    </JobSwipeableContainer>
  );
}
