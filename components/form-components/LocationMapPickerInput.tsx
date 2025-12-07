import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView } from 'react-native';
import { Input, InputField } from '@/components/ui/input';
import { MapPin, X, Check, Search } from 'lucide-react-native';
import MapView, { Marker, Region, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';

interface LocationMapPickerInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  placeholder?: string;
}

interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
}

export function LocationMapPickerInput({
  value,
  onChangeText,
  onBlur,
  placeholder = 'Select location',
}: LocationMapPickerInputProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [region, setRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView>(null);

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Search / Autocomplete State
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Map Search State
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSuggestions, setMapSuggestions] = useState<NominatimResult[]>([]);
  const [showMapDropdown, setShowMapDropdown] = useState(false);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Sync internal query with prop value updates
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const fetchSuggestions = async (searchText: string, isMapSearch: boolean) => {
    if (searchText.length < 3) {
      if (isMapSearch) {
        setMapSuggestions([]);
        setShowMapDropdown(false);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
      return;
    }

    if (isMapSearch) setMapSuggestions([]);
    else setLoadingSuggestions(true);

    try {
      // OpenStreetMap Nominatim API
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&addressdetails=1&limit=5`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SoleApp/1.0', // Required by Nominatim
        },
      }
      );
      const data = await response.json();

      if (isMapSearch) {
        setMapSuggestions(data);
        setShowMapDropdown(true);
      } else {
        setSuggestions(data);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      if (!isMapSearch) setLoadingSuggestions(false);
    }
  };

  // Debounce helper
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const debouncedFetch = useCallback(debounce(fetchSuggestions, 800), []);

  const handleInputChange = (text: string) => {
    setQuery(text);
    onChangeText(text); // Update parent input immediately
    debouncedFetch(text, false);
  };

  const handleMapSearchChange = (text: string) => {
    setMapSearchQuery(text);
    debouncedFetch(text, true);
  };

  const handleSuggestionSelect = (item: NominatimResult, isMapSearch: boolean) => {
    const formattedAddress = item.display_name;
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);

    const newRegion = {
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

    if (isMapSearch) {
      // Move map to location
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);

      setMapSearchQuery(formattedAddress); // Retain the name!
      setMapSuggestions([]);
      setShowMapDropdown(false);
    } else {
      // Update main input
      setQuery(formattedAddress);
      onChangeText(formattedAddress);
      setSuggestions([]);
      setShowDropdown(false);
      // Also set the region so if they open the map next, it's there
      setRegion(newRegion);
    }
  };

  const handleOpenMap = async () => {
    setSuggestions([]);
    setShowDropdown(false);
    setModalVisible(true);
    // If we already have a region (from suggestion or previous open), use it.
    if (!region) {
      setLoadingLocation(true);
      try {
        if (hasPermission) {
          const servicesEnabled = await Location.hasServicesEnabledAsync();
          if (servicesEnabled) {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Lowest,
            });
            setRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
          } else {
            // Services off: fallback
            setRegion({
              latitude: 22.28552,
              longitude: 114.15769,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }
        } else {
          // Permission not granted: fallback
          setRegion({
            latitude: 22.28552,
            longitude: 114.15769,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      } catch (error) {
        // Swallow noisy emulator/location errors; still fall back to default
        setRegion({
          latitude: 22.28552,
          longitude: 114.15769,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } finally {
        setLoadingLocation(false);
      }
    }
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    // Only update state, don't force re-render/animate loop
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
        // Construct a readable address string based on available fields
        const parts = [
          address.name === address.street ? null : address.name, // Avoid dupe
          address.street,
          address.district,
          address.city,
          address.region,
        ].filter(Boolean);

        // Remove duplicates and join
        const formattedAddress = [...new Set(parts)].join(', ');

        setQuery(formattedAddress);
        onChangeText(formattedAddress);
        setSuggestions([]);
        setShowDropdown(false);
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
    <View className="z-50">
      {/* Main Input Area */}
      <View className="relative z-50">
        <View className="flex-row items-center border border-white/20 rounded-2xl bg-zinc-600 p-0 overflow-hidden">
          <View className="flex-1">
            <Input className="border-0 bg-transparent h-12">
              <InputField
                value={query}
                onChangeText={handleInputChange}
                onBlur={onBlur}
                placeholder={placeholder}
                placeholderTextColor="#6b7280"
                className="text-white h-12"
                editable={true}
              />
            </Input>
          </View>
          <TouchableOpacity onPress={handleOpenMap} className="pr-4 pl-2 h-12 justify-center">
            <MapPin size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Main Dropdown Suggestions - Using View/map to avoid nested VirtualizedLists */}
        {showDropdown && suggestions.length > 0 && (
          <View className="absolute top-14 left-0 right-0 bg-zinc-800 border border-white/10 rounded-xl overflow-hidden shadow-lg z-[100] max-h-48">
            <ScrollView keyboardShouldPersistTaps="handled">
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={String(item.place_id)}
                  onPress={() => handleSuggestionSelect(item, false)}
                  className="p-3 border-b border-white/5 flex-row items-center"
                >
                  <MapPin size={14} color="#9ca3af" className="mr-2" />
                  <Text className="text-white text-sm" numberOfLines={1}>
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <Modal
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black">
          {/* Map Search Bar */}
          <View className="absolute top-12 left-4 right-4 z-20">
            <View className="flex-row items-center bg-zinc-900 rounded-full shadow-lg px-4 h-12 border border-white/10">
              <TouchableOpacity onPress={() => setModalVisible(false)} className="mr-3">
                <X size={20} color="white" />
              </TouchableOpacity>
              <TextInput
                value={mapSearchQuery}
                onChangeText={handleMapSearchChange}
                placeholder="Search for a place..."
                placeholderTextColor="#9ca3af"
                className="flex-1 text-white h-full text-base"
                autoCapitalize="none"
              />
              {mapSearchQuery ? (
                <TouchableOpacity onPress={() => handleMapSearchChange('')}>
                  <X size={16} color="#9ca3af" />
                </TouchableOpacity>
              ) : (
                <Search size={20} color="#9ca3af" />
              )}
            </View>

            {/* Map Dropdown Suggestions */}
            {showMapDropdown && mapSuggestions.length > 0 && (
              <View className="mt-2 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-lg max-h-60">
                <ScrollView keyboardShouldPersistTaps="handled">
                  {mapSuggestions.map((item) => (
                    <TouchableOpacity
                      key={String(item.place_id)}
                      onPress={() => handleSuggestionSelect(item, true)}
                      className="p-4 border-b border-white/5 flex-row items-center bg-zinc-900"
                    >
                      <MapPin size={16} color="#9ca3af" className="mr-3" />
                      <Text className="text-white text-sm flex-1" numberOfLines={2}>
                        {item.display_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {loadingLocation ? (
            <View className="flex-1 items-center justify-center bg-zinc-900">
              <ActivityIndicator size="large" color="white" />
              <Text className="text-white mt-4">Getting location...</Text>
            </View>
          ) : (
            <View className="flex-1 rounded-3xl overflow-hidden mt-0">
              {region && (
                <MapView
                  ref={mapRef}
                  style={{ flex: 1 }}
                  initialRegion={region}
                  // Don't bind region={region} loosely or it snaps back.
                  // Use initialRegion + animateToRegion for smooth control.
                  onRegionChangeComplete={handleRegionChangeComplete}
                  showsUserLocation={true}
                  showsMyLocationButton={false}
                  provider={PROVIDER_DEFAULT}
                />
              )}

              {/* Center Marker Overlay */}
              <View
                className="absolute top-1/2 left-1/2 -ml-4 -mt-8 pointer-events-none items-center justify-center"
                style={{ marginLeft: -20, marginTop: -40 }} // Precise centering
              >
                <MapPin size={40} color="#ef4444" fill="white" />
              </View>

              {/* Bottom Action */}
              <View className="absolute bottom-10 left-4 right-4 z-20">
                <TouchableOpacity
                  onPress={confirmLocation}
                  disabled={loadingAddress}
                  className={`bg-blue-600 rounded-2xl py-4 flex-row justify-center items-center shadow-lg ${loadingAddress ? 'opacity-70' : ''}`}
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
