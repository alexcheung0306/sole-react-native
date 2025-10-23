import { View, Text, TouchableOpacity } from 'react-native';
import { User, Briefcase } from 'lucide-react-native';

interface InterfaceSwitcherProps {
  currentInterface: 'talent' | 'client';
  onSwitch: (interfaceType: 'talent' | 'client') => void;
}

export function InterfaceSwitcher({ currentInterface, onSwitch }: InterfaceSwitcherProps) {
  return (
    <View className="flex-row bg-gray-800/50 rounded-lg p-1 mb-4">
      <TouchableOpacity
        onPress={() => onSwitch('talent')}
        className={`flex-1 flex-row items-center justify-center py-2 px-4 rounded-md ${
          currentInterface === 'talent' 
            ? 'bg-blue-500' 
            : 'bg-transparent'
        }`}
        activeOpacity={0.7}
      >
        <User 
          size={16} 
          color={currentInterface === 'talent' ? '#ffffff' : '#9ca3af'} 
        />
        <Text 
          className={`ml-2 font-medium ${
            currentInterface === 'talent' 
              ? 'text-white' 
              : 'text-gray-400'
          }`}
        >
          Talent
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onSwitch('client')}
        className={`flex-1 flex-row items-center justify-center py-2 px-4 rounded-md ${
          currentInterface === 'client' 
            ? 'bg-blue-500' 
            : 'bg-transparent'
        }`}
        activeOpacity={0.7}
      >
        <Briefcase 
          size={16} 
          color={currentInterface === 'client' ? '#ffffff' : '#9ca3af'} 
        />
        <Text 
          className={`ml-2 font-medium ${
            currentInterface === 'client' 
              ? 'text-white' 
              : 'text-gray-400'
          }`}
        >
          Client
        </Text>
      </TouchableOpacity>
    </View>
  );
}
