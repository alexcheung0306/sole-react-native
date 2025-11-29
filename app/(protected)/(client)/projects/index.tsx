import React from 'react';
import { ManageContractProvider } from '~/context/ManageContractContext';
import { ManageProjectProvider } from '~/context/ManageProjectContext';
import ManageProjectsPage from './manage-projects';
import ManageContractsPage from './manage-contracts';
import ProjectTabContainer from '@/components/projects/ProjectTabContainer';
import ProjectDetailPage from './project-detail';
import ContractDetailPage from './contract';

export default React.memo(function ProjectsIndex() {
  return (
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
  );
});

