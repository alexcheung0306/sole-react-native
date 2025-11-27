import { useProjectTabContext } from '@/context/ProjectTabContext';
import ManageProjectsPage from './manage-projects';
import ManageContractsPage from './manage-contracts';
import ProjectSwipeableContainer from '@/components/projects/ProjectSwipeableContainer';

// Map tab names to indices
const tabToIndex = {
  'manage-projects': 0,
  'manage-contracts': 1,
} as const;

export default function ProjectsIndex() {
  const { activeTab } = useProjectTabContext();

  const activeIndex = tabToIndex[activeTab];

  return (
    <ProjectSwipeableContainer activeIndex={activeIndex}>
      <ManageProjectsPage />
      <ManageContractsPage />
    </ProjectSwipeableContainer>
  );
}

