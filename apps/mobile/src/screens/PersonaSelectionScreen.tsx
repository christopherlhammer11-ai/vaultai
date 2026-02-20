import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { palette } from '@mobile/theme/colors';

const personas = [
  { name: 'Product Strategist' },
  { name: 'Marketing Guru' },
  { name: 'Data Analyst' },
];

const PersonaSelectionScreen = ({ navigation }) => {
  const handleSelectPersona = (persona) => {
    // Save selected persona logic here
    navigation.navigate('FirstChatTutorial');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Persona</Text>
      {personas.map((persona, index) => (
        <Button
          key={index}
          title={persona.name}
          onPress={() => handleSelectPersona(persona)}
        />
      ))}
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
});

export default PersonaSelectionScreen;