import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { palette } from '@mobile/theme/colors';

const FirstChatTutorialScreen = ({ navigation }) => {
  const handleStartChat = () => {
    // Logic to start the chat
    navigation.navigate('Chat');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your First Chat</Text>
      <Text style={styles.description}>Let’s start your first conversation with your assistant!</Text>
      <Button title="Start Chat" onPress={handleStartChat} />
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
    fontSize: 18,
    color: palette.textSecondary,
    marginBottom: 20,
  },
});

export default FirstChatTutorialScreen;