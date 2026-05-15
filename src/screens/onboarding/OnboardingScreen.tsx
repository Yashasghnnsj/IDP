import React, { useRef, useState } from 'react';
import { View, StyleSheet, FlatList, Animated, Dimensions } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Colors } from '../../theme';
import { onboardData } from './data';

const { width } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const renderItem = ({ item }: any) => (
    <View style={styles.slide}>
      {item.image}
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const onNext = () => {
    if (currentIndex < onboardData.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.replace('Auth', { screen: 'Login' });
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={onboardData}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(idx);
        }}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
      />
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {onboardData.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === currentIndex ? Colors.primary : Colors.border },
              ]}
            />
          ))}
        </View>
        <Button
          mode="contained"
          onPress={onNext}
          style={styles.nextButton}
          labelStyle={{ color: '#FFF', fontWeight: '600' }}
        >
          {currentIndex === onboardData.length - 1 ? 'Get Started' : 'Next'}
        </Button>
        <Button onPress={() => navigation.replace('Auth', { screen: 'Login' })}>
          Skip
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  slide: { width, alignItems: 'center', paddingTop: 80 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 40, textAlign: 'center', color: Colors.text },
  description: { fontSize: 16, marginTop: 16, textAlign: 'center', color: Colors.textSecondary, paddingHorizontal: 30 },
  footer: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },
  pagination: { flexDirection: 'row', marginBottom: 30 },
  dot: { width: 10, height: 10, borderRadius: 5, marginHorizontal: 5 },
  nextButton: { width: '80%', borderRadius: 28, backgroundColor: Colors.primary, paddingVertical: 6 },
});