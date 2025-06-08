import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Alert, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { insertCard, updateCard, fetchCardById } from '../db/database';
import { Card } from '../types'; // Card is used by fetchCardById

type CreateEditCardScreenRouteProp = RouteProp<RootStackParamList, 'CreateEditCard'>;
type CreateEditCardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateEditCard'>;

export default function CreateEditCardScreen() {
  const navigation = useNavigation<CreateEditCardScreenNavigationProp>();
  const route = useRoute<CreateEditCardScreenRouteProp>();
  // deckId is for creating new cards. cardId, initialFront, initialBack are for editing.
  const { deckId, cardId, front: initialFront, back: initialBack } = route.params;

  const [front, setFront] = useState(initialFront || '');
  const [back, setBack] = useState(initialBack || '');
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = cardId !== undefined;

  useEffect(() => {
    // Only fetch from DB if cardId is present (editing) AND data wasn't passed via params
    // (e.g. if navigated directly or params were not complete)
    if (isEditing && cardId && (initialFront === undefined || initialBack === undefined)) {
      setIsLoading(true);
      console.log(`Fetching card data for cardId: ${cardId}`);
      const loadCardData = async () => {
        try {
          const card = await fetchCardById(cardId);
          if (card) {
            setFront(card.front);
            setBack(card.back);
          } else {
            Alert.alert('Error', 'Card not found.');
            navigation.goBack();
          }
        } catch (error) {
          console.error('Failed to load card data:', error);
          Alert.alert('Error', 'Failed to load card data.');
          navigation.goBack();
        } finally {
          setIsLoading(false);
        }
      };
      loadCardData();
    } else if (isEditing && initialFront !== undefined && initialBack !== undefined) {
      // If data is passed via params, use it directly (already set in useState initial values)
      console.log(`Using passed card data for cardId: ${cardId}`);
    }
  }, [cardId, isEditing, navigation, initialFront, initialBack]);

  const handleSaveCard = async () => {
    if (front.trim() === '' || back.trim() === '') {
      Alert.alert('Error', 'Front and back text cannot be empty.');
      return;
    }
    try {
      if (isEditing && cardId) {
        await updateCard(cardId, front.trim(), back.trim());
        Alert.alert('Success', 'Card updated successfully!');
      } else if (deckId !== undefined) { // Ensure deckId is present for new cards
        await insertCard(deckId, front.trim(), back.trim());
        Alert.alert('Success', 'Card created successfully!');
      } else {
        Alert.alert('Error', 'Deck ID is missing. Cannot create card.');
        return;
      }
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save card:', error);
      Alert.alert('Error', 'Failed to save card.');
    }
  };

  if (isLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" /><Text>Loading card data...</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Front:</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Enter front text (e.g., question)"
        value={front}
        onChangeText={setFront}
        multiline
      />
      <Text style={styles.label}>Back:</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Enter back text (e.g., answer)"
        value={back}
        onChangeText={setBack}
        multiline
      />
      <Button title={isEditing ? Save Changes : Create Card} onPress={handleSaveCard} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
