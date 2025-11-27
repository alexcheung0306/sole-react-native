import { View } from 'react-native';
import { ManageProjectProvider } from '@/context/ManageProjectContext';
import { ManageContractProvider } from '@/context/ManageContractContext';
import { HeaderProvider, useHeaderContext } from '@/context/HeaderContext';
import { CollapsibleHeader } from '@/components/CollapsibleHeader';
import ProjectsNavTabs from '@/components/projects/ProjectsNavTabs';
import ProjectsIndex from './projects/index';

function ProjectHeaderWrapper({ children }: { children: React.ReactNode }) {
  const { title } = useHeaderContext();
  
  // Show ProjectsNavTabs when title is default 'Projects' or when title is a ReactNode that's not ProjectsNavTabs
  // Otherwise show the custom title (for project-detail, contract, etc.)
  const headerTitle = (title === 'Projects' || !title) ? <ProjectsNavTabs /> : title;
  
  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <CollapsibleHeader
        title={headerTitle}
        translateY={0}
        isDark={true}
      />
      {children}
    </View>
  );
}

export default function ProjectRouteWrapper() {
  return (
    <ManageProjectProvider>
      <ManageContractProvider>
        <HeaderProvider>
          <ProjectHeaderWrapper>
            <ProjectsIndex />
          </ProjectHeaderWrapper>
        </HeaderProvider>
      </ManageContractProvider>
    </ManageProjectProvider>
  );
}

