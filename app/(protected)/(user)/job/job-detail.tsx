import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, DollarSign, Users, MapPin, Briefcase } from 'lucide-react-native';
import { useSoleUserContext } from '~/context/SoleUserContext';
import { getProjectByID } from '~/api/apiservice/project_api';
import { getRolesByProjectId } from '~/api/apiservice/role_api';
import { getJobApplicantsByProjectIdAndSoleUserId } from '~/api/apiservice/applicant_api';
import { getJobContractsWithProfileByProjectIdAndTalentId } from '~/api/apiservice/jobContracts_api';
import { useState } from 'react';

export default function JobDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const projectId = parseInt(params.id as string);
  const { soleUserId } = useSoleUserContext();
  const [selectedTab, setSelectedTab] = useState<'details' | 'roles' | 'contracts'>('details');
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);

  // Fetch project data
  const {
    data: projectData,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery({
    queryKey: ['projectDetail', projectId],
    queryFn: () => getProjectByID(projectId),
    enabled: !!projectId && !isNaN(projectId),
  });

  // Fetch roles
  const {
    data: rolesData,
    isLoading: rolesLoading,
  } = useQuery({
    queryKey: ['projectRoles', projectId],
    queryFn: () => getRolesByProjectId(projectId),
    enabled: !!projectId && !isNaN(projectId),
  });

  // Fetch user's applications for this project
  const {
    data: applicationsData,
    isLoading: applicationsLoading,
  } = useQuery({
    queryKey: ['userApplications', projectId, soleUserId],
    queryFn: () => getJobApplicantsByProjectIdAndSoleUserId(projectId, soleUserId as string),
    enabled: !!projectId && !!soleUserId,
  });

  // Fetch user's contracts for this project
  const {
    data: contractsData,
    isLoading: contractsLoading,
  } = useQuery({
    queryKey: ['userContracts', projectId, soleUserId],
    queryFn: () => getJobContractsWithProfileByProjectIdAndTalentId(projectId, soleUserId as string),
    enabled: !!projectId && !!soleUserId,
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'published':
        return 'bg-green-500/20 text-green-400';
      case 'draft':
        return 'bg-gray-500/20 text-gray-400';
      case 'inprogress':
      case 'in progress':
        return 'bg-blue-500/20 text-blue-400';
      case 'completed':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (projectLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-400 mt-4">Loading job details...</Text>
      </View>
    );
  }

  if (projectError || !projectData) {
    return (
      <View className="flex-1 bg-black justify-center items-center p-4">
        <Text className="text-red-400 text-center mb-4">
          Failed to load job details
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-blue-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const project = projectData.project || projectData;
  const roles = rolesData || [];
  const selectedRole = roles[selectedRoleIndex];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-black">
        {/* Custom Header */}
        <View className="bg-black pt-12 pb-4 px-4 border-b border-gray-700/50">
          <View className="flex-row items-center mb-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-3 p-2"
            >
              <ArrowLeft size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-white flex-1">
              Job #{projectId}
            </Text>
          </View>

          {/* Status Badge */}
          <View className={`px-3 py-1 rounded-full self-start ${getStatusColor(project.status)}`}>
            <Text className={`text-xs font-semibold ${getStatusColor(project.status).split(' ').pop()}`}>
              {project.status}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-black border-b border-gray-700/50">
          <TouchableOpacity
            onPress={() => setSelectedTab('details')}
            className={`flex-1 py-3 ${selectedTab === 'details' ? 'border-b-2 border-blue-500' : ''}`}
          >
            <Text className={`text-center font-semibold ${selectedTab === 'details' ? 'text-white' : 'text-gray-500'}`}>
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedTab('roles')}
            className={`flex-1 py-3 ${selectedTab === 'roles' ? 'border-b-2 border-blue-500' : ''}`}
          >
            <Text className={`text-center font-semibold ${selectedTab === 'roles' ? 'text-white' : 'text-gray-500'}`}>
              Roles ({roles.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedTab('contracts')}
            className={`flex-1 py-3 ${selectedTab === 'contracts' ? 'border-b-2 border-blue-500' : ''}`}
          >
            <Text className={`text-center font-semibold ${selectedTab === 'contracts' ? 'text-white' : 'text-gray-500'}`}>
              Contracts ({contractsData?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1">
          {/* Details Tab */}
          {selectedTab === 'details' && (
            <View className="p-4">
              {/* Project Image */}
              {project.projectImage && (
                <Image
                  source={{ uri: project.projectImage }}
                  className="w-full h-64 rounded-2xl mb-4"
                  resizeMode="cover"
                />
              )}

              {/* Project Name */}
              <Text className="text-2xl font-bold text-white mb-4">
                {project.projectName}
              </Text>

              {/* Project Description */}
              {project.projectDescription && (
                <View className="bg-gray-800/20 p-4 rounded-2xl border border-gray-700/30 mb-4">
                  <Text className="text-sm font-semibold text-gray-400 mb-2">Description</Text>
                  <Text className="text-gray-300 leading-6">{project.projectDescription}</Text>
                </View>
              )}

              {/* Application Deadline */}
              {project.applicationDeadline && (
                <View className="bg-gray-800/20 p-4 rounded-2xl border border-gray-700/30 mb-4">
                  <View className="flex-row items-center">
                    <Calendar size={20} color="#ef4444" />
                    <Text className="text-white font-semibold ml-2">Application Deadline</Text>
                  </View>
                  <Text className="text-gray-300 mt-2">{formatDate(project.applicationDeadline)}</Text>
                </View>
              )}

              {/* Usage */}
              {project.usage && (
                <View className="bg-gray-800/20 p-4 rounded-2xl border border-gray-700/30 mb-4">
                  <Text className="text-sm font-semibold text-gray-400 mb-2">Usage</Text>
                  <Text className="text-gray-300">{project.usage}</Text>
                </View>
              )}

              {/* Remarks */}
              {project.remarks && (
                <View className="bg-gray-800/20 p-4 rounded-2xl border border-gray-700/30 mb-4">
                  <Text className="text-sm font-semibold text-gray-400 mb-2">Remarks</Text>
                  <Text className="text-gray-300 italic">{project.remarks}</Text>
                </View>
              )}
            </View>
          )}

          {/* Roles Tab */}
          {selectedTab === 'roles' && (
            <View className="p-4">
              {rolesLoading ? (
                <ActivityIndicator size="large" color="#3b82f6" />
              ) : roles.length === 0 ? (
                <View className="items-center justify-center py-20">
                  <Briefcase size={64} color="#4b5563" />
                  <Text className="text-gray-400 mt-4">No roles available for this project</Text>
                </View>
              ) : (
                <>
                  {/* Role Selector */}
                  {roles.length > 1 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                      {roles.map((role: any, index: number) => (
                        <TouchableOpacity
                          key={role.role?.id || index}
                          onPress={() => setSelectedRoleIndex(index)}
                          className={`mr-2 px-4 py-2 rounded-lg ${selectedRoleIndex === index ? 'bg-blue-500' : 'bg-gray-800/50 border border-gray-700/30'}`}
                        >
                          <Text className={`${selectedRoleIndex === index ? 'text-white' : 'text-gray-400'} font-semibold`}>
                            {role.role?.roleTitle || `Role ${index + 1}`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}

                  {/* Selected Role Details */}
                  {selectedRole && (
                    <View>
                      <View className="bg-gray-800/20 p-4 rounded-2xl border border-gray-700/30 mb-4">
                        <Text className="text-xl font-bold text-white mb-3">{selectedRole.role?.roleTitle}</Text>
                        
                        {selectedRole.role?.roleDescription && (
                          <Text className="text-gray-300 mb-4">{selectedRole.role.roleDescription}</Text>
                        )}

                        {/* Role Details Grid */}
                        <View className="space-y-3">
                          {selectedRole.role?.requiredGender && (
                            <View className="flex-row justify-between">
                              <Text className="text-gray-400">Gender:</Text>
                              <Text className="text-white">{selectedRole.role.requiredGender}</Text>
                            </View>
                          )}

                          {(selectedRole.role?.ageMin || selectedRole.role?.ageMax) && (
                            <View className="flex-row justify-between">
                              <Text className="text-gray-400">Age Range:</Text>
                              <Text className="text-white">
                                {selectedRole.role.ageMin || 'N/A'} - {selectedRole.role.ageMax || 'N/A'}
                              </Text>
                            </View>
                          )}

                          {selectedRole.role?.budget && (
                            <View className="flex-row justify-between items-center">
                              <Text className="text-gray-400">Budget:</Text>
                              <View className="flex-row items-center">
                                <DollarSign size={16} color="#10b981" />
                                <Text className="text-green-400 font-semibold">
                                  ${selectedRole.role.budget} {selectedRole.role.paymentBasis && `/ ${selectedRole.role.paymentBasis}`}
                                </Text>
                              </View>
                            </View>
                          )}

                          {selectedRole.role?.talentNumbers && (
                            <View className="flex-row justify-between items-center">
                              <Text className="text-gray-400">Positions:</Text>
                              <View className="flex-row items-center">
                                <Users size={16} color="#3b82f6" />
                                <Text className="text-blue-400 ml-1">{selectedRole.role.talentNumbers}</Text>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Activities & Schedules */}
                      {selectedRole.activities && selectedRole.activities.length > 0 && (
                        <View className="mb-4">
                          <Text className="text-lg font-bold text-white mb-3">Activities & Schedules</Text>
                          {selectedRole.activities.map((activity: any, idx: number) => (
                            <View key={activity.id || idx} className="bg-gray-800/20 p-4 rounded-2xl border border-gray-700/30 mb-3">
                              <Text className="text-white font-semibold mb-2">{activity.title}</Text>
                              <View className="bg-blue-500/20 px-2 py-1 rounded self-start mb-2">
                                <Text className="text-blue-400 text-xs">{activity.type}</Text>
                              </View>
                              
                              {activity.schedules && activity.schedules.length > 0 && (
                                <View className="mt-2">
                                  {activity.schedules.map((schedule: any, sIdx: number) => (
                                    <View key={schedule.id || sIdx} className="border-l-2 border-gray-700 pl-3 mb-2">
                                      {schedule.location && (
                                        <View className="flex-row items-center mb-1">
                                          <MapPin size={14} color="#9ca3af" />
                                          <Text className="text-gray-300 ml-2">{schedule.location}</Text>
                                        </View>
                                      )}
                                      {schedule.fromTime && (
                                        <Text className="text-gray-400 text-sm">
                                          {formatDate(schedule.fromTime)} - {schedule.toTime && formatDate(schedule.toTime)}
                                        </Text>
                                      )}
                                    </View>
                                  ))}
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Application Status */}
                      {applicationsData && applicationsData.length > 0 && (
                        <View className="bg-green-500/20 p-4 rounded-2xl border border-green-700/30">
                          <Text className="text-green-400 font-semibold mb-2">You've Applied!</Text>
                          {applicationsData.map((app: any) => (
                            app.roleId === selectedRole.role?.id && (
                              <Text key={app.id} className="text-gray-300">
                                Status: {app.applicationProcess || app.applicationStatus}
                              </Text>
                            )
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* Contracts Tab */}
          {selectedTab === 'contracts' && (
            <View className="p-4">
              {contractsLoading ? (
                <ActivityIndicator size="large" color="#3b82f6" />
              ) : !contractsData || contractsData.length === 0 ? (
                <View className="items-center justify-center py-20">
                  <Text className="text-gray-400">No contracts for this project yet</Text>
                </View>
              ) : (
                contractsData.map((contract: any) => (
                  <TouchableOpacity
                    key={contract.id}
                    onPress={() => router.push(`/job/contract-detail?id=${contract.id}` as any)}
                    className="bg-gray-800/20 p-4 rounded-2xl border border-gray-700/30 mb-3"
                  >
                    <Text className="text-white font-semibold mb-2">Contract #{contract.id}</Text>
                    <Text className="text-gray-300 mb-1">{contract.roleTitle}</Text>
                    <View className="bg-blue-500/20 px-3 py-1 rounded-full self-start">
                      <Text className="text-blue-400 text-xs">{contract.contractStatus}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

