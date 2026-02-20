import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { palette } from '@mobile/theme/colors';

export default function SettingsScreen() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('default-model');

  const { setApiKey, setModel: updateModel } = useVaultSession();

const handleSave = () => {
    setApiKey(apiKey);
    setModel(model);
    console.log('API Key saved:', apiKey);
    console.log('Selected Model saved:', model);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter API Key"
        value={apiKey}
        onChangeText={setApiKey}
      />
      <TextInput
        style={styles.input}
        placeholder="Select Model"
        value={model}
        onChangeText={setModel}
      />
      <Button title="Save" onPress={handleSave} color={palette.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: palette.background,
  },
  title: {
    fontSize: 24,
    color: palette.textPrimary,
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: palette.border,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: palette.surface,
  },
});
