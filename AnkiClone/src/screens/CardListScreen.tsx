import React, { useState, useCallback } from 'react';
import { View, Text, Button, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { fetchCardsForDeck, deleteCard } from '../db/database';
import { Card } from '../types';

type CardListScreenRouteProp = RouteProp<RootStackParamList, 'CardList'>;
type CardListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CardList'>;

export default function CardListScreen() {
  const navigation = useNavigation<CardListScreenNavigationProp>();
  const route = useRoute<CardListScreenRouteProp>();
  const { deckId, deckName } = route.params;

  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCards = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedCards = await fetchCardsForDeck(deckId);
      setCards(fetchedCards);
    } catch (error) {
      console.error('Failed to load cards:', error);
      Alert.alert('Error', 'Failed to load cards.');
    } finally {
      setIsLoading(false);
    }
  }, [deckId]);

  useFocusEffect(loadCards);

  const handleEditCard = (card: Card) => {
    navigation.navigate('CreateEditCard', { deckId, cardId: card.id, front: card.front, back: card.back });
  };

  const handleDeleteCard = (cardId: number) => {
    Alert.alert('Delete Card', 'Are you sure you want to delete this card?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCard(cardId);
            Alert.alert('Success', 'Card deleted successfully.');
            loadCards();
          } catch (error) {
            console.error('Failed to delete card:', error);
            Alert.alert('Error', 'Failed to delete card.');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" /><Text>Loading cards for {deckName}...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerButtons}>
        <Button
            title="Add New Card"
            onPress={() => navigation.navigate('CreateEditCard', { deckId })}
        />
        <Button
            title="Review This Deck"
            onPress={() => navigation.navigate('Review', { deckId, deckName })}
            disabled={cards.length === 0}
        />
      </View>
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.cardItemContainer}>
            <TouchableOpacity style={styles.cardItemContent} onPress={() => handleEditCard(item)}>
              <Text style={styles.cardFront}>{item.front}</Text>
              <Text style={styles.cardBack}>{item.back}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteCard(item.id)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<View style={styles.emptyContainer}><Text>No cards in this deck. Add some to start reviewing!</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  cardItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
    paddingHorizontal: 5,
  },
  cardItemContent: {
    flex: 1,
    marginRight: 10,
  },
  cardFront: {
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 6,
  },
  cardBack: {
    fontSize: 15,
    color: '#444',
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: 'red',
    fontSize: 15,
    fontWeight: '500',
  },
});
