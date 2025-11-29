import React from 'react';
import { AppliedRolesProvider } from '~/context/AppliedRolesContext';
import { JobPostsProvider } from '~/context/JobPostsContext';
import { MyContractsProvider } from '~/context/MyContractsContext';
import JobPosts from './job-posts';
import AppliedRoles from './applied-roles';
import MyContracts from './my-contracts';
import JobTabContainer from '@/components/job/JobTabContainer';




export default React.memo(function JobIndex() {
  return (
    <JobPostsProvider>
      <AppliedRolesProvider>
        <MyContractsProvider>
          <JobTabContainer>
            <JobPosts />
            <AppliedRoles />
            <MyContracts />
          </JobTabContainer>
        </MyContractsProvider>
      </AppliedRolesProvider>
    </JobPostsProvider>
  );
});
