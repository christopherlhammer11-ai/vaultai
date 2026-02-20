import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { palette } from '@mobile/theme/colors';

const WelcomeScreen = ({ navigation }) => {
  const handleGetStarted = () => {
    navigation.navigate('VaultPasswordCreation');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to HammerLock AI!</Text>
      <Text style={styles.description}>Your secure vault awaits. Let’s get started!</Text>
      <Button title="Get Started" onPress={handleGetStarted} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: palette.background,
  },
  title: {
    fontSize: 32,
    color: palette.textPrimary,
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    color: palette.textSecondary,
    marginBottom: 20,
  },
});

export default WelcomeScreen;