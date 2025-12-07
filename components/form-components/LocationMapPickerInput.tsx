import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Input, InputField } from '@/components/ui/input';
import { MapPin, X, Check } from 'lucide-react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';

interface LocationMapPickerInputProps {
    value: string;
    onChangeText: (text: string) => void;
    onBlur?: () => void;
    placeholder?: string;
}

export function LocationMapPickerInput({
    value,
    onChangeText,
    onBlur,
    placeholder = 'Select location',
}: LocationMapPickerInputProps) {
    const [modalVisible, setModalVisible] = useState(false);
    const [region, setRegion] = useState<Region | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [loadingAddress, setLoadingAddress] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<string>('');

    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleOpenMap = async () => {
        setModalVisible(true);
        setLoadingLocation(true);

        try {
            if (hasPermission) {
                const location = await Location.getCurrentPositionAsync({});
                setRegion({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                });
            } else {
                // Default to a central location (e.g., Hong Kong or user preference) or last known
                // Fallback: Hong Kong Central
                setRegion({
                    latitude: 22.28552,
                    longitude: 114.15769,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                });
            }
        } catch (error) {
            console.error("Error getting location:", error);
            Alert.alert("Location Error", "Could not get current location.");
            setRegion({
                latitude: 22.28552,
                longitude: 114.15769,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
        } finally {
            setLoadingLocation(false);
        }
    };

    const handleRegionChangeComplete = async (newRegion: Region) => {
        setRegion(newRegion);
    };

    const confirmLocation = async () => {
        if (!region) return;

        setLoadingAddress(true);
        try {
            const result = await Location.reverseGeocodeAsync({
                latitude: region.latitude,
                longitude: region.longitude,
            });

            if (result.length > 0) {
                const address = result[0];
                // Construct a readable address string
                const parts = [
                    address.name,
                    address.street,
                    address.district,
                    address.city,
                    address.region,
                ].filter(Boolean);

                // Remove duplicates and join
                const formattedAddress = [...new Set(parts)].join(', ');

                onChangeText(formattedAddress);
                setModalVisible(false);
            } else {
                Alert.alert("Address not found", "Could not find an address for this location.");
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            Alert.alert("Error", "Failed to get address.");
        } finally {
            setLoadingAddress(false);
        }
    };

    return (
        <View>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleOpenMap}
                className="flex-row items-center border border-white/20 rounded-2xl bg-zinc-600 p-0 overflow-hidden"
            >
                <View className="flex-1">
                    <Input className="border-0 bg-transparent h-12">
                        <InputField
                            value={value}
                            onChangeText={onChangeText}
                            onBlur={onBlur}
                            placeholder={placeholder}
                            placeholderTextColor="#6b7280"
                            className="text-white h-12"
                            editable={true} // Allow manual editing
                        />
                    </Input>
                </View>
                <View className="pr-4">
                    <MapPin size={20} color="#ffffff" />
                </View>
            </TouchableOpacity>

            <Modal
                animationType="slide"
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 bg-black">
                    {/* Header / Controls */}
                    <View className="absolute top-12 left-4 right-4 z-10 flex-row justify-between items-center">
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            className="w-10 h-10 bg-black/60 rounded-full items-center justify-center p-2"
                        >
                            <X size={24} color="white" />
                        </TouchableOpacity>
                        <View className="bg-black/60 rounded-full px-4 py-2">
                            <Text className="text-white font-semibold">Move map to select</Text>
                        </View>
                        <View className="w-10" />
                    </View>

                    {loadingLocation ? (
                        <View className="flex-1 items-center justify-center">
                            <ActivityIndicator size="large" color="white" />
                            <Text className="text-white mt-4">Getting location...</Text>
                        </View>
                    ) : (
                        <View className="flex-1">
                            {region && (
                                <MapView
                                    style={{ flex: 1 }}
                                    initialRegion={region}
                                    onRegionChangeComplete={handleRegionChangeComplete}
                                    showsUserLocation={true}
                                    showsMyLocationButton={true}
                                />
                            )}

                            {/* Center Marker Overlay */}
                            <View
                                className="absolute top-1/2 left-1/2 -ml-4 -mt-8 pointer-events-none"
                                style={{ marginLeft: -15, marginTop: -35 }} // Adjust based on icon size
                            >
                                <MapPin size={40} color="#ef4444" fill="white" />
                            </View>

                            {/* Bottom Action */}
                            <View className="absolute bottom-10 left-4 right-4">
                                <TouchableOpacity
                                    onPress={confirmLocation}
                                    disabled={loadingAddress}
                                    className={`bg-blue-600 rounded-2xl py-4 flex-row justify-center items-center ${loadingAddress ? 'opacity-70' : ''}`}
                                >
                                    {loadingAddress ? (
                                        <ActivityIndicator color="white" className="mr-2" />
                                    ) : (
                                        <Check size={20} color="white" className="mr-2" />
                                    )}
                                    <Text className="text-white font-bold text-center text-lg">
                                        {loadingAddress ? 'Getting Address...' : 'Confirm Location'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
}
