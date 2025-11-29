import React from 'react';
import { ManageContractProvider } from '~/context/ManageContractContext';
import { ManageProjectProvider } from '~/context/ManageProjectContext';
import ManageProjectsPage from './manage-projects';
import ManageContractsPage from './manage-contracts';
import ProjectTabContainer from '@/components/projects/ProjectTabContainer';
import ProjectDetailPage from './project-detail';
import ContractDetailPage from './contract';
import { CollapsibleHeader } from '~/components/CollapsibleHeader';
import ProjectsNavTabs from '~/components/projects/ProjectsNavTabs';
import { useScrollHeader } from '~/hooks/useScrollHeader';

export default React.memo(function ProjectsIndex() {
  const { headerTranslateY, handleScroll } = useScrollHeader();

  return (
    <>
      <CollapsibleHeader title={<ProjectsNavTabs />} translateY={headerTranslateY} isDark={true} />

      <ManageProjectProvider>
        <ManageContractProvider>

          <ProjectTabContainer>
            <ManageProjectsPage />
            <ManageContractsPage />
            <ProjectDetailPage />
            <ContractDetailPage />
          </ProjectTabContainer>

        </ManageContractProvider>
      </ManageProjectProvider>
    </>
  );
});

