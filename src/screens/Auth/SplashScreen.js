import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import COLORS from '../../constants/colors';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const hintTranslate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textTranslateY, { toValue: 0, duration: 800, useNativeDriver: true }),
        Animated.timing(textFadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(hintTranslate, { toValue: -6, duration: 700, useNativeDriver: true }),
        Animated.timing(hintTranslate, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();

    return () => {};
  }, []);

  const onGestureEvent = Animated.event([{ nativeEvent: { translationY: dragY } }], { useNativeDriver: true });
  const onHandlerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      if (nativeEvent.translationY < -80) {
        navigation?.reset?.({ index: 0, routes: [{ name: 'Login' }] });
      }
      Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start();
    }
  };

  const dragTransform = {
    transform: [
      {
        translateY: dragY.interpolate({
          inputRange: [-150, 0, 150],
          outputRange: [-40, 0, 40],
          extrapolate: 'clamp',
        }),
      },
    ],
  };

  return (
    <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
      <Animated.View style={[{ flex: 1 }, dragTransform]}>
        <LinearGradient colors={[COLORS.primary, '#145242']} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <StatusBar style="light" />
          <View style={styles.logoContainer}>
            <Animated.View style={[styles.logoWrapper, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
              <View style={styles.circleBackground}>
                <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
              </View>
            </Animated.View>
          </View>
          <Animated.View style={[styles.footer, { opacity: textFadeAnim, transform: [{ translateY: textTranslateY }] }]}>
            <Text style={styles.appName}>LOGISEN</Text>
            <View style={styles.divider} />
            <Text style={styles.slogan}>Glissez vers le haut pour continuer ↑</Text>
            <Animated.Text style={[styles.hint, { transform: [{ translateY: hintTranslate }] }]}>↑</Animated.Text>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoWrapper: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
  circleBackground: { width: width * 0.55, height: width * 0.55, backgroundColor: 'white', borderRadius: (width * 0.55) / 2, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  logo: { width: '100%', height: '100%' },
  footer: { paddingBottom: 60, alignItems: 'center', width: '80%' },
  appName: { color: COLORS.white, fontSize: 32, fontWeight: 'bold', letterSpacing: 2, marginBottom: 10 },
  divider: { width: 40, height: 3, backgroundColor: COLORS.secondary, marginBottom: 15, borderRadius: 2 },
  slogan: { color: COLORS.secondary, fontSize: 16, fontWeight: '400', textAlign: 'center', lineHeight: 24, opacity: 0.9 },
  hint: { marginTop: 6, color: COLORS.white, fontSize: 20, fontWeight: '700' },
});

export default SplashScreen;
