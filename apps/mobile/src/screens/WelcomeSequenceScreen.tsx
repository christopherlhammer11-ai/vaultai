import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { palette } from '@mobile/theme/colors';

const WelcomeSequenceScreen = ({ navigation }) => {
  const handleFinish = () => {
    // Logic to finish onboarding and navigate to the main app
    navigation.navigate('Chat');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to HammerLock AI!</Text>
      <Text style={styles.description}>Your secure vault is ready. Let’s get started!</Text>
      <Button title="Start Using HammerLock AI" onPress={handleFinish} />
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
    fontSize: 24,
    color: palette.textPrimary,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: palette.textSecondary,
    marginBottom: 20,
  },
});

export default WelcomeSequenceScreen;