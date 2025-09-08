import { Avatar, AvatarBadge, AvatarFallbackText, AvatarImage } from '@/components/ui/avatar';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { router } from 'expo-router';

export function UserAvatar({ userInfo, username }: { userInfo: any, username: string }) {
    console.log('userInfo', userInfo);
  return (
    <VStack space="2xl">
      <HStack space="md">
        <Avatar>
          <AvatarFallbackText>SS</AvatarFallbackText>
          <AvatarImage
            source={{
              uri: userInfo?.userInfo?.profilePic,
            }}
          />
        </Avatar>
        <VStack>
          <Heading size="sm">{userInfo.userInfo?.name}</Heading>
          <Text className='cursor-pointer' size="sm" onPress={() => router.push(`/user/${username}`)}>@{username}</Text>
        </VStack>
      </HStack>
    </VStack>
  );
}
