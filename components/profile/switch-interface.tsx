import { useState } from "react";
import { TouchableOpacity, View, Text, Modal, Pressable } from "react-native";

interface SwitchInterfaceProps {
  setProfileTypeModalVisible: (visible: boolean) => void;
  setUserInterface:any;
  profileTypeModalVisible: boolean;
  userInterface: string;
}

export function SwitchInterface({setProfileTypeModalVisible, setUserInterface, profileTypeModalVisible, userInterface}: SwitchInterfaceProps) {


  const handleProfileTypeSelect = (option: string) => {
    console.log(`Selected profile type: ${option}`);
    setProfileTypeModalVisible(false);
    
    // Set userInterface based on selection
    if (option === 'Client') {
      setUserInterface('USER');
      console.log('userInterface changed to: USER');
    } else if (option === 'Talent') {
      setUserInterface('TALENT');
      console.log('userInterface changed to: TALENT');
    }
  };
    return (
        <>
        
        <Modal
          visible={profileTypeModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setProfileTypeModalVisible(false)}
        >
          <Pressable 
            style={{ 
            
            }}
            onPress={() => setProfileTypeModalVisible(false)}
          >
            <View
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                borderRadius: 16,
                padding: 20,
                margin: 20,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Text style={{ 
                color: '#ffffff', 
                fontSize: 18, 
                fontWeight: 'bold', 
                marginBottom: 20,
                textAlign: 'center'
              }}>
                Select Profile Type
              </Text>
              
              <TouchableOpacity
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
          }}
          onPress={() => handleProfileTypeSelect('Talent')}
        >
          <Text style={{ 
            color: '#ffffff', 
            fontSize: 16, 
            fontWeight: '600',
            textAlign: 'center'
          }}>
            🎭 Talent
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
          }}
          onPress={() => handleProfileTypeSelect('Client')}
        >
          <Text style={{ 
            color: '#ffffff', 
            fontSize: 16, 
            fontWeight: '600',
            textAlign: 'center'
          }}>
            💼 Client
          </Text>
        </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </>
    )
}