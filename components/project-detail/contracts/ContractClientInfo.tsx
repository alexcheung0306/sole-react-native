import { View, Text, Image } from 'react-native';

export default function ContractClientInfo({ clientData }: { clientData: any }) {
  return (
    <View className="mb-4 rounded-xl border border-white/10 bg-zinc-800/60 p-5">
      <Text className="mb-4 text-lg font-bold text-white">Client Information</Text>
      <View className="flex-row items-start gap-4">
        <Image
          source={{
            uri: clientData?.profilePic || clientData?.imageUrl || 'https://via.placeholder.com/80',
          }}
          className="h-16 w-16 rounded-full"
        />
        <View className="flex-1">
          <Text className="mb-1 text-base font-semibold text-white">
            {clientData?.name || 'Client'}
          </Text>
          <Text className="mb-3 text-sm text-blue-400">@{clientData?.username || 'username'}</Text>
          <View className="gap-2">
            <View>
              <Text className="mb-1 text-xs font-medium text-gray-400">Email:</Text>
              <Text className="break-words text-sm text-white">
                {clientData?.email || 'Not specified'}
              </Text>
            </View>
            {clientData?.company && (
              <View>
                <Text className="mb-1 text-xs font-medium text-gray-400">Company:</Text>
                <Text className="break-words text-sm text-white">{clientData.company}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
