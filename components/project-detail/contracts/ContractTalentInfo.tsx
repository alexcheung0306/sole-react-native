import { View, Text, Image } from 'react-native';

export default function ContractTalentInfo({
  talentData,
  talentName,
  contractData,
}: {
  talentData: any;
  talentName: string;
  contractData: any;
}) {
  return (
    <View className="mb-4 rounded-xl border border-white/10 bg-zinc-800/60 p-5">
      <Text className="mb-4 text-lg font-bold text-white">Talent Information</Text>
      {talentData ? (
        <View className="flex-row items-start gap-4">
          <Image
            source={{
              uri:
                talentData?.profilePic ||
                talentData?.imageUrl ||
                contractData?.comcardFirstPic ||
                'https://via.placeholder.com/80',
            }}
            className="h-16 w-16 rounded-full"
          />
          <View className="flex-1">
            <Text className="mb-1 text-base font-semibold text-white">
              {talentData?.name || talentName || 'Talent'}
            </Text>
            <Text className="mb-3 text-sm text-blue-400">
              @{talentData?.username || 'username'}
            </Text>
            <View>
              <Text className="mb-1 text-xs font-medium text-gray-400">Email:</Text>
              <Text className="break-words text-sm text-white">
                {talentData?.email || 'Not specified'}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View className="flex-row items-start gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-zinc-700">
            <Text className="text-2xl text-gray-400">👤</Text>
          </View>
          <View className="flex-1">
            <Text className="self-start rounded bg-yellow-400/10 px-2 py-1 text-xs text-yellow-400">
              Profile information is not available for this user
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
