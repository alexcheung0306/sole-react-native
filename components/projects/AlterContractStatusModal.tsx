import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateJobContractsStatusById } from '@/api/apiservice/jobContracts_api';

// Status configuration mapping
const STATUS_CONFIG = {
  cancelled: {
    status: 'Cancelled',
    color: '#ef4444',
    buttonText: 'Cancel Contract',
    modalTitle: 'Cancel Contract',
    actionText: 'Cancel',
    description: 'this contract',
  },
  activated: {
    status: 'Activated',
    color: '#10b981',
    buttonText: 'Activate Contract',
    modalTitle: 'Activate Contract',
    actionText: 'Activate',
    description: 'this contract',
  },
  completed: {
    status: 'Completed',
    color: '#10b981',
    buttonText: 'Mark as Completed',
    modalTitle: 'Mark as Completed',
    actionText: 'Complete',
    description: 'this contract',
  },
  paid: {
    status: 'Paid',
    color: '#8b5cf6',
    buttonText: 'Mark as Paid',
    modalTitle: 'Mark as Paid',
    actionText: 'Mark as Paid',
    description: 'this contract',
  },
};

type StatusOption = keyof typeof STATUS_CONFIG;

interface AlterContractStatusModalProps {
  contractId: number;
  options: StatusOption;
  readByTalent?: boolean;
  readByClient?: boolean;
  onSuccess?: () => void;
}

export default function AlterContractStatusModal({
  contractId,
  options,
  readByTalent = true,
  readByClient = false,
  onSuccess,
}: AlterContractStatusModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const config = STATUS_CONFIG[options];

  const mutation = useMutation({
    mutationFn: () =>
      updateJobContractsStatusById(
        {
          contractStatus: config.status,
          readByTalent,
          readByClient,
        },
        contractId
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      queryClient.invalidateQueries({ queryKey: ['manageContracts'] });
      Alert.alert('Success', `${config.status} successfully`);
      setIsOpen(false);
      onSuccess?.();
    },
    onError: () => {
      Alert.alert('Error', `Failed to ${config.actionText.toLowerCase()}`);
    },
  });

  const handleConfirm = () => {
    mutation.mutate();
  };

  return (
    <>
      <TouchableOpacity
        className="py-3.5 px-5 rounded-lg items-center my-2"
        style={{ backgroundColor: config.color }}
        onPress={() => setIsOpen(true)}
      >
        <Text className="text-white text-base font-semibold">
          {config.buttonText}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View className="bg-gray-900 rounded-2xl p-6 w-full max-w-[400px] border-2 border-blue-500">
            <Text className="text-xl font-bold text-white mb-4">
              {config.modalTitle}
            </Text>

            <Text className="text-base text-gray-300 mb-3 leading-6">
              Are you sure you want to{' '}
              <Text className="font-bold" style={{ color: config.color }}>
                {config.actionText}
              </Text>{' '}
              {config.description}?
            </Text>

            <Text className="text-sm text-gray-400 mb-6">
              This action cannot be undone.
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg items-center bg-red-500/20 border border-red-500"
                onPress={() => setIsOpen(false)}
                disabled={mutation.isPending}
              >
                <Text className="text-red-500 text-base font-semibold">
                  Close
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-3 rounded-lg items-center bg-blue-500"
                onPress={handleConfirm}
                disabled={mutation.isPending}
              >
                <Text className="text-white text-base font-semibold">
                  {mutation.isPending ? 'Processing...' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
