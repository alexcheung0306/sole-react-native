import { TouchableOpacity, View, Text } from 'react-native';
import { Briefcase, User } from 'lucide-react-native';
import { useNavigation } from '@/context/NavigationContext';

export function SwitchInterface({ setIsOpen }: { setIsOpen: (isOpen: boolean) => void }) {
  const { currentMode, switchToClient, switchToUser } = useNavigation();

  const handleTap = () => {
    // Start navigation immediately
    if (currentMode === 'user') {
      switchToClient();
    } else {
      switchToUser();
    }

    // Close drawer after navigation starts (smooth timing)
    setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const CurrentIcon = currentMode === 'user' ? User : Briefcase;
  const nextMode = currentMode === 'user' ? 'Client' : 'User';

  return (
    <TouchableOpacity
      onPress={handleTap}
      className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
      activeOpacity={0.85}>
      <View className="rounded-full bg-blue-500/20 p-2">
        <CurrentIcon size={20} color="#bfdbfe" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-white">
          Switch to {nextMode}
        </Text>
        <Text className="text-xs text-gray-400 mt-0.5">
          Tap to switch modes 
        </Text>
      </View>
    </TouchableOpacity>
  );
}
