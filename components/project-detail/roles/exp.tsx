import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 100;
const CARD_WIDTH = SCREEN_WIDTH * 0.8;
const CARD_HEIGHT = 400;

type CardProps = {
  value: number;
  borderColor: string;
  isOnTop: boolean;
  onSwipeComplete: () => void;
};

function Card({ value, borderColor, isOnTop, onSwipeComplete }: CardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(isOnTop ? 1 : 0.95);

  // Create a worklet-safe callback ref
  const onSwipeCompleteRef = React.useRef(onSwipeComplete);
  React.useEffect(() => {
    onSwipeCompleteRef.current = onSwipeComplete;
  }, [onSwipeComplete]);

  const panGesture = Gesture.Pan()
    .enabled(isOnTop)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.1; // Reduce vertical movement
    })
    .onEnd((event) => {
      const absX = Math.abs(event.translationX);
      
      if (absX > SWIPE_THRESHOLD) {
        // Swipe completed - slide off screen
        const direction = event.translationX > 0 ? 1 : -1;
        translateX.value = withTiming(
          direction * SCREEN_WIDTH * 1.5,
          { duration: 300 },
          (finished) => {
            if (finished) {
              // Call completion callback after animation finishes
              runOnJS(onSwipeCompleteRef.current)();
            }
          }
        );
        opacity.value = withTiming(0, { duration: 300 });
      } else {
        // Spring back to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  // Track previous state to detect transitions
  const prevIsOnTopRef = React.useRef(isOnTop);
  
  // Reset card when it moves to back or becomes front
  React.useEffect(() => {
    const wasOnTop = prevIsOnTopRef.current;
    const isNowOnTop = isOnTop;
    
    if (isNowOnTop) {
      // Card is now on top - animate scale from 0.95 to 1.0
      translateX.value = 0;
      translateY.value = 0;
      opacity.value = 1;
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
    } else {
      // Card is behind - instant reset (no animation when going back)
      translateX.value = 0;
      translateY.value = 0;
      opacity.value = 1;
      scale.value = 0.95;
    }
    
    prevIsOnTopRef.current = isOnTop;
  }, [isOnTop, translateX, translateY, opacity, scale]);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.card,
          {
            borderColor,
            zIndex: isOnTop ? 2 : 1,
          },
          animatedStyle,
        ]}>
        <Text style={[styles.cardText, { color: borderColor }]}>
          {value}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}

// Simulate API fetch
const fetchNumbersFromAPI = async (): Promise<number[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  // Return mock data (simulating API response)
  return [10, 20, 30, 40, 50];
};

export function Exp() {
  const [array, setArray] = useState<number[]>([]);
  const [onTop, setOnTop] = useState<"A" | "B">("A");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from "API" on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchNumbersFromAPI();
        setArray(data);
      } catch (error) {
        console.error("Failed to fetch:", error);
        // Fallback to default data
        setArray([1, 2, 3, 4, 5]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Get values based on which card is on top
  // When A is on top: A shows array[0], B shows array[1]
  // When B is on top: B shows array[0], A shows array[1]
  const cardAValue = onTop === "A" ? array[0] ?? null : array[1] ?? null;
  const cardBValue = onTop === "A" ? array[1] ?? null : array[0] ?? null;

  const handleCardSwipeComplete = useCallback(() => {
    // Remove first element and add a new one to make it infinite
    setArray((prev) => {
      const newArray = [...prev];
      newArray.shift();
      // Add next number to the end to keep it infinite
      const lastNumber = prev[prev.length - 1] || 0;
      newArray.push(lastNumber + 1);
      return newArray;
    });

    // Switch which card is on top
    setOnTop((prev) => (prev === "A" ? "B" : "A"));
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Fetching numbers from API...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.cardContainer}>
        {/* Card B (behind) */}
        {cardBValue !== null && (
          <Card
            value={cardBValue}
            borderColor={onTop === "A" ? "red" : "red"}
            isOnTop={onTop === "B"}
            onSwipeComplete={handleCardSwipeComplete}
          />
        )}

        {/* Card A (front) */}
        {cardAValue !== null && (
          <Card
            value={cardAValue}
            borderColor={onTop === "A" ? "blue" : "blue"}
            isOnTop={onTop === "A"}
            onSwipeComplete={handleCardSwipeComplete}
          />
        )}
      </View>

      {/* Debug info */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>Array: {JSON.stringify(array)}</Text>
        <Text style={styles.debugText}>Card A: {cardAValue ?? "null"}</Text>
        <Text style={styles.debugText}>Card B: {cardBValue ?? "null"}</Text>
        <Text style={styles.debugText}>On Top: {onTop}</Text>
        <Text style={styles.debugText}>Data from API: ✓</Text>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: "relative",
  },
  card: {
    position: "absolute",
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderWidth: 4,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    fontSize: 72,
    fontWeight: "bold",
  },
  debugContainer: {
    marginTop: 40,
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
  },
  debugText: {
    color: "#fff",
    fontSize: 14,
    marginVertical: 4,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
});
