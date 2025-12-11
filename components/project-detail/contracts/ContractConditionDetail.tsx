import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import CollapseDrawer from '@/components/custom/collapse-drawer';
import { formatDateTime } from '@/utils/time-converts';
import EditContractConditionFormModal from '~/components/project-detail/contracts/EditContractConditionFormModal';

interface ContractConditionDetailProps {
  condition: any;
  isLatest?: boolean;
  contractId: number;
  clientId: string;
  getStatusColor: (status: string) => string;
  formatCurrency: (amount: number, currency: string) => string;
  calculateTotalHours: (schedules: any[]) => number;
  calculateEstimatedTotal: (condition: any) => number;
}

export default function ContractConditionDetail({
  condition,
  isLatest = false,
  contractId,
  clientId,
  getStatusColor,
  formatCurrency,
  calculateTotalHours,
  calculateEstimatedTotal,
}: ContractConditionDetailProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        className="bg-zinc-800/60 rounded-xl p-4 border border-white/10"
        onPress={() => setIsDrawerOpen(!isDrawerOpen)}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white font-semibold text-sm mb-1">
              {formatDateTime(condition.createdAt)}
            </Text>
            {isLatest && (
              <View
                className="px-2 py-1 rounded self-start"
                style={{
                  backgroundColor: getStatusColor(condition.conditionStatus) + '33',
                }}>
                <Text
                  style={{ color: getStatusColor(condition.conditionStatus) }}
                  className="text-xs font-semibold">
                  {condition.conditionStatus}
                </Text>
              </View>
            )}
          </View>
          {isDrawerOpen ? (
            <ChevronUp color="#9ca3af" size={20} />
          ) : (
            <ChevronDown color="#9ca3af" size={20} />
          )}
        </View>
      </TouchableOpacity>

      <CollapseDrawer
        showDrawer={isDrawerOpen}
        setShowDrawer={setIsDrawerOpen}
        title="Condition Details">
        <View className="px-4 pb-4 gap-4">
          <View>
            <Text className="text-gray-400 text-xs font-medium mb-1">Usage Rights:</Text>
            <Text className="text-white text-sm">
              {condition.usageRights || 'No usage rights specified'}
            </Text>
          </View>

          {/* Schedules */}
          {condition.schedules && condition.schedules.length > 0 && (
            <View className="mt-4 pt-4 border-t border-white/10">
              <Text className="text-white font-medium mb-3">
                Job Schedules ({condition.schedules.length})
              </Text>
              <View className="gap-3">
                {condition.schedules.map((schedule: any, idx: number) => (
                  <View
                    key={schedule.id || idx}
                    className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <View className="gap-2">
                      <View>
                        <Text className="text-gray-400 text-xs font-medium">Location:</Text>
                        <Text className="text-white text-sm">
                          {schedule.location || 'Not specified'}
                        </Text>
                      </View>
                      <View className="flex-row gap-4">
                        <View className="flex-1">
                          <Text className="text-gray-400 text-xs font-medium">From:</Text>
                          <Text className="text-white text-sm">
                            {formatDateTime(schedule.fromTime)}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-400 text-xs font-medium">To:</Text>
                          <Text className="text-white text-sm">
                            {formatDateTime(schedule.toTime)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Payment Details */}
          <View className="mt-4 pt-4 border-t border-white/10">
            <Text className="text-white font-medium mb-3">Payment Details</Text>
            <View className="gap-2">
              {condition.schedules && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-400 text-sm">Total Job Hours:</Text>
                  <Text className="text-white font-semibold text-sm">
                    {calculateTotalHours(condition.schedules).toFixed(1)} hours
                  </Text>
                </View>
              )}
              <View className="flex-row justify-between">
                <Text className="text-gray-400 text-sm">Payment Amount:</Text>
                <Text className="text-green-400 font-semibold text-sm">
                  {formatCurrency(condition.paymentAmount, condition.paymentCurrency)}
                </Text>
              </View>
              {condition.paymentAmountOt > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-400 text-sm">Overtime Per Hour:</Text>
                  <Text className="text-yellow-400 text-sm">
                    {formatCurrency(condition.paymentAmountOt, condition.paymentCurrency)}
                  </Text>
                </View>
              )}
              {condition.paymentAdditional > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-400 text-sm">Additional:</Text>
                  <Text className="text-green-400 text-sm">
                    {formatCurrency(condition.paymentAdditional, condition.paymentCurrency)}
                  </Text>
                </View>
              )}
              <View className="flex-row justify-between">
                <Text className="text-gray-400 text-sm">Basis:</Text>
                <Text className="text-white text-sm">{condition.paymentBasis}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-400 text-sm">Currency:</Text>
                <Text className="text-white text-sm">{condition.paymentCurrency}</Text>
              </View>
              <View className="mt-2 pt-2 border-t border-white/10">
                <View className="flex-row justify-between">
                  <Text className="text-white font-semibold text-sm">
                    Estimated Total Payment:
                  </Text>
                  <Text className="text-green-400 font-bold text-base">
                    {formatCurrency(calculateEstimatedTotal(condition), condition.paymentCurrency)}
                  </Text>
                </View>
              </View>
              {condition.paymentDate && (
                <View className="flex-row justify-between mt-2">
                  <Text className="text-gray-400 text-sm">Payment Date:</Text>
                  <Text className="text-white text-sm">
                    {new Date(condition.paymentDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Terms & Conditions */}
          <View className="mt-4 pt-4 border-t border-white/10">
            <Text className="text-white font-medium mb-2">Terms & Conditions</Text>
            <View className="bg-white/5 border border-white/10 rounded-lg p-3">
              <Text className="text-white/90 text-sm leading-relaxed">
                {condition.termsAndConditions || 'No terms specified'}
              </Text>
            </View>
            <Text className="text-white font-medium mb-2 mt-4">Usage Rights</Text>
            <View className="bg-white/5 border border-white/10 rounded-lg p-3">
              <Text className="text-white/90 text-sm leading-relaxed">
                {condition.usageRights || 'No usage rights specified'}
              </Text>
            </View>
          </View>

          <View className="mt-2 pt-2 border-t border-white/10">
            <Text className="text-gray-400 text-xs">
              Created: {formatDateTime(condition.createdAt)}
            </Text>
            <Text className="text-gray-400 text-xs">
              Updated: {formatDateTime(condition.updatedAt)}
            </Text>
          </View>

          {/* Edit Button - Only for latest condition */}
          {isLatest && (
            <View className="mt-4 pt-4 border-t border-white/10">
              <EditContractConditionFormModal
                condition={condition}
                contractId={contractId}
                clientId={clientId}
              />
            </View>
          )}
        </View>
      </CollapseDrawer>
    </>
  );
}

