import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { 
  FileText, 
  Calendar, 
  UserCheck, 
  UserX, 
  Mail, 
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  FileSignature
} from 'lucide-react-native';
import { getStatusColorObject } from '@/utils/get-status-color';

interface ActionToCandidatesProps {
  applicant: any;
  projectData: any;
  roleId?: number;
  contractsData?: any[];
  isLoadingContracts?: boolean;
}

export function ActionToCandidates({ 
  applicant, 
  projectData,
  roleId,
  contractsData = [],
  isLoadingContracts = false,
}: ActionToCandidatesProps) {
  const applicationStatus = applicant?.jobApplicant?.applicationStatus || 'applied';
  const soleUserId = applicant?.jobApplicant?.soleUserId;

  // Handle contract navigation
  const handleContractPress = (contractId: number) => {
    // TODO: Navigate to contract detail page when route is created
    console.log('Navigate to contract:', contractId);
  };

  // If status is "shortlisted" - show offer options
  if (applicationStatus === 'shortlisted') {
    return (
      <View className="gap-4">
        {/* Header */}
        <View className="px-4 pt-4">
          <View className="flex-row items-center gap-2 mb-2">
            <FileSignature size={24} color="#10b981" />
            <Text className="text-xl font-bold text-white">Send Offer</Text>
          </View>
          <Text className="text-sm text-white/60">
            This candidate has been shortlisted and is ready to receive an offer
          </Text>
        </View>

        {/* Success Card */}
        <View className="mx-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 p-6">
          <View className="items-center gap-3">
            <View className="w-16 h-16 rounded-full bg-green-500/20 items-center justify-center">
              <CheckCircle2 size={32} color="#10b981" />
            </View>
            <Text className="text-lg font-bold text-white text-center">
              Candidate Shortlisted!
            </Text>
            <Text className="text-sm text-white/70 text-center">
              Create a contract to send a formal offer to this candidate
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <View className="px-4 pb-4">
          <TouchableOpacity
            className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-xl flex-row items-center justify-center gap-2 shadow-lg"
            onPress={() => {
              // TODO: Navigate to create contract page when route is created
              console.log('Create contract for:', {
                projectId: projectData?.id,
                roleId: roleId,
                talentId: soleUserId,
                applicantId: applicant?.jobApplicant?.id,
              });
            }}>
            <Plus size={20} color="#ffffff" />
            <Text className="text-white font-bold text-base">Create Contract</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // If status is "offered" - show contracts list
  if (applicationStatus === 'offered') {
    return (
      <View className="gap-4">
        {/* Header */}
        <View className="px-4 pt-4">
          <View className="flex-row items-center gap-2 mb-2">
            <FileText size={24} color="#f97316" />
            <Text className="text-xl font-bold text-white">Active Contracts</Text>
          </View>
          <Text className="text-sm text-white/60">
            View and manage all contracts for this candidate
          </Text>
        </View>

        {isLoadingContracts ? (
          <View className="mx-4 rounded-2xl border border-white/10 bg-zinc-800/50 p-8">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-sm text-white/60 text-center mt-3">
              Loading contracts...
            </Text>
          </View>
        ) : contractsData && contractsData.length > 0 ? (
          <View className="px-4 gap-3 pb-4">
            {contractsData.map((contractItem: any) => {
              const contract = contractItem.jobContract;
              const statusColors = getStatusColorObject(contract.contractStatus);
              
              return (
                <TouchableOpacity
                  key={contract.id}
                  className="rounded-2xl border border-white/10 bg-zinc-800/80 p-4 active:bg-zinc-700/80"
                  onPress={() => handleContractPress(contract.id)}>
                  {/* Contract Header */}
                  <View className="flex-row items-center gap-3 mb-3">
                    <View 
                      className="w-12 h-12 rounded-xl items-center justify-center"
                      style={{ backgroundColor: statusColors.bg }}>
                      <FileText size={22} color={statusColors.text} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-base text-white mb-1">
                        Contract #{contract.id}
                      </Text>
                      <Text className="text-sm text-white/70">
                        {contract.roleTitle || 'Role Title'}
                      </Text>
                    </View>
                  </View>

                  {/* Contract Details */}
                  <View className="flex-row items-center justify-between pt-3 border-t border-white/5">
                    <View className="flex-row items-center gap-2">
                      <View
                        className="px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: statusColors.bg }}>
                        <Text
                          className="text-xs font-bold uppercase tracking-wide"
                          style={{ color: statusColors.text }}>
                          {contract.contractStatus}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="items-end gap-1">
                      <View className="flex-row items-center gap-1.5">
                        <Calendar size={14} color="#9ca3af" />
                        <Text className="text-xs text-white/60 font-medium">
                          {new Date(
                            contract.createdAt || contract.updatedAt
                          ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                      {contract.conditions && contract.conditions.length > 0 && (
                        <Text className="text-xs text-white/50">
                          {contract.conditions.length} condition{contract.conditions.length > 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View className="mx-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8">
            <View className="items-center gap-3">
              <View className="w-16 h-16 bg-amber-500/20 rounded-full items-center justify-center">
                <FileText size={28} color="#f59e0b" />
              </View>
              <Text className="font-bold text-lg text-amber-500">
                No Contracts Yet
              </Text>
              <Text className="text-sm text-white/60 text-center">
                No contracts have been created for this candidate
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  // Default: Show actions (shortlist, reject, invite)
  return (
    <View className="mt-4 rounded-2xl border border-white/10 bg-zinc-800 p-4">
      <Text className="text-base font-semibold text-white mb-4">
        Candidate Actions
      </Text>
      
      {/* Candidate Info Summary */}
      <View className="mb-4 p-3 rounded-lg bg-zinc-700/50">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm text-white/60">Current Status:</Text>
          <Text className="text-sm text-white font-semibold">
            {applicationStatus}
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-white/60">Application Process:</Text>
          <Text className="text-sm text-white font-semibold">
            {applicant?.jobApplicant?.applicationProcess || 'Applied'}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      {applicationStatus !== 'rejected' && (
        <View className="gap-3">
          <TouchableOpacity
            className="bg-green-500 px-4 py-3 rounded-lg"
            onPress={() => {
              // TODO: Implement shortlist action
              console.log('Shortlist candidate:', applicant?.jobApplicant?.id);
            }}>
            <Text className="text-white font-semibold text-center">
              Shortlist Candidate
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-blue-500 px-4 py-3 rounded-lg"
            onPress={() => {
              // TODO: Implement invite action
              console.log('Invite candidate:', applicant?.jobApplicant?.id);
            }}>
            <Text className="text-white font-semibold text-center">
              Invite to Activity
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-red-500 px-4 py-3 rounded-lg"
            onPress={() => {
              // TODO: Implement reject action
              console.log('Reject candidate:', applicant?.jobApplicant?.id);
            }}>
            <Text className="text-white font-semibold text-center">
              Reject Candidate
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {applicationStatus === 'rejected' && (
        <View className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <Text className="text-red-400 text-center">
            This candidate has been rejected and cannot be modified.
          </Text>
        </View>
      )}
    </View>
  );
}

