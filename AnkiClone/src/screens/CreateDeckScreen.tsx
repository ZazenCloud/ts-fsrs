import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { insertDeck } from '../db/database';

type CreateDeckScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateDeck'>;

export default function CreateDeckScreen() {
  const navigation = useNavigation<CreateDeckScreenNavigationProp>();
  const [deckName, setDeckName] = useState('');

  const handleCreateDeck = async () => {
    if (deckName.trim() === '') {
      Alert.alert('Error', 'Deck name cannot be empty.');
      return;
    }
    try {
      await insertDeck(deckName.trim());
      Alert.alert('Success', 'Deck created successfully!');
      navigation.goBack(); // Or navigate to DeckList
    } catch (error: any) {
      console.error('Failed to create deck:', error);
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        Alert.alert('Error', 'A deck with this name already exists.');
      } else {
        Alert.alert('Error', 'Failed to create deck.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Enter Deck Name"
        value={deckName}
        onChangeText={setDeckName}
      />
      <Button title="Create Deck" onPress={handleCreateDeck} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
});
