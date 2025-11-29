import React from 'react';
import { AppliedRolesProvider } from '~/context/AppliedRolesContext';
import { JobPostsProvider } from '~/context/JobPostsContext';
import { MyContractsProvider } from '~/context/MyContractsContext';
import JobPosts from './job-posts';
import AppliedRoles from './applied-roles';
import MyContracts from './my-contracts';
import JobTabContainer from '@/components/job/JobTabContainer';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import JobsNavTabs from '~/components/job/JobsNavTabs';
import { useScrollHeader } from '~/hooks/useScrollHeader';




export default React.memo(function JobIndex() {
  const { headerTranslateY, handleScroll } = useScrollHeader();

  return (
    <>
      <CollapsibleHeader title={<JobsNavTabs />} translateY={headerTranslateY} isDark={true} />


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
    </>
  );
});
