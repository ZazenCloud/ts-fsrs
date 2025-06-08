import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Button, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { fetchDecks, deleteDeck } from '../db/database';
import { Deck } from '../types';

type DeckListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'DeckList'>;

export default function DeckListScreen() {
  const navigation = useNavigation<DeckListScreenNavigationProp>();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDecks = useCallback(async () => {
    try {
      const fetchedDecks = await fetchDecks();
      setDecks(fetchedDecks);
    } catch (error) {
      console.error('Failed to load decks:', error);
      Alert.alert('Error', 'Failed to load decks.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadDecks();
    }, [loadDecks])
  );

  const handleDeleteDeck = (id: number) => {
    Alert.alert(
      'Delete Deck',
      'Are you sure you want to delete this deck? All associated cards will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDeck(id);
              Alert.alert('Success', 'Deck deleted successfully.');
              setIsLoading(true);
              loadDecks();
            } catch (error) {
              console.error('Failed to delete deck:', error);
              Alert.alert('Error', 'Failed to delete deck.');
            }
          },
        },
      ]
    );
  };

  const handleNavigateToCardList = (deck: Deck) => {
    navigation.navigate('CardList', { deckId: deck.id, deckName: deck.name });
  };

  if (isLoading) {
    return <View style={styles.container}><Text>Loading decks...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={decks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.deckItemContainer}>
            <TouchableOpacity style={styles.deckItem} onPress={() => handleNavigateToCardList(item)}>
              <Text style={styles.deckName}>{item.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteDeck(item.id)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text>No decks available. Create one!</Text>}
      />
      <Button
        title="Create New Deck"
        onPress={() => navigation.navigate('CreateDeck')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  deckItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 10,
  },
  deckItem: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal:10,
  },
  deckName: {
    fontSize: 18,
  },
  deleteButton: {
    padding: 10,
    marginLeft:10,
  },
  deleteButtonText: {
    color: 'red',
    fontSize: 16,
  },
});
