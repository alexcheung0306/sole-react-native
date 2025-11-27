import JobPosts from './job-posts';
import AppliedRoles from './applied-roles';
import MyContracts from './my-contracts';
import JobTabContainer from '@/components/job/JobTabContainer';

export default function JobIndex() {
  return (
    <JobTabContainer>
      <JobPosts />
      <AppliedRoles />
      <MyContracts />
    </JobTabContainer>
  );
}
