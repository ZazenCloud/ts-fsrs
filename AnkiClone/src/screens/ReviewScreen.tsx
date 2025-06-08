import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getDueCardsForDeck, recordReview } from '../db/database';
import { Card } from '../types';
import { Rating } from '../fsrs/models';

type ReviewScreenRouteProp = RouteProp<RootStackParamList, 'Review'>;
type ReviewScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Review'>;

export default function ReviewScreen() {
  const navigation = useNavigation<ReviewScreenNavigationProp>();
  const route = useRoute<ReviewScreenRouteProp>();
  const { deckId, deckName } = route.params;

  const [dueCards, setDueCards] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  const loadDueCards = useCallback(async (isReviewAgain: boolean = false) => {
    console.log(`Loading due cards for deck: ${deckId}. Review again: ${isReviewAgain}`);
    if (isReviewAgain) {
        setSessionStarted(false); // Allow initial loading message to show by resetting sessionStarted
        setReviewComplete(false);
        setCurrentCardIndex(0);
        setCurrentCard(null);
        setShowAnswer(false);
    }
    setIsLoading(true);

    try {
      const cards = await getDueCardsForDeck(deckId, new Date());
      console.log('Fetched due cards:', cards.length);
      setDueCards(cards);
      if (cards.length > 0) {
        setCurrentCard(cards[0]);
        setCurrentCardIndex(0);
        setShowAnswer(false);
        setReviewComplete(false);
      } else {
        setCurrentCard(null);
        setReviewComplete(true);
      }
    } catch (error) {
      console.error('Failed to load due cards:', error);
      Alert.alert('Error', 'Failed to load due cards.');
      setCurrentCard(null);
      setReviewComplete(true);
    } finally {
      setIsLoading(false);
      setSessionStarted(true);
    }
  }, [deckId]);

  useFocusEffect(
    useCallback(() => {
      console.log(`Focus effect: sessionStarted=${sessionStarted}, reviewComplete=${reviewComplete}, isLoading=${isLoading}`);
      // Only auto-load if the session hasn't properly started yet,
      // or if the review was marked complete (allowing a 'review again' implicitly by refocusing)
      if (!sessionStarted || reviewComplete) {
         loadDueCards();
      }
      // Note: Leaving and returning to an active session will not auto-reload.
      // This might be desired, or one might want to reload if 'dueCards' is empty but session not 'complete'.
    }, [loadDueCards, sessionStarted, reviewComplete])
  );

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleGrade = async (rating: Rating) => {
    if (!currentCard) return;

    setIsLoading(true); // Show loading for the brief period of DB update and state change
    try {
      await recordReview(currentCard.id, rating, new Date());
      const nextIndex = currentCardIndex + 1;

      if (nextIndex < dueCards.length) {
        setCurrentCardIndex(nextIndex);
        setCurrentCard(dueCards[nextIndex]);
        setShowAnswer(false);
      } else {
        const refreshedDueCards = await getDueCardsForDeck(deckId, new Date());
        setDueCards(refreshedDueCards);
        if (refreshedDueCards.length > 0) {
            setCurrentCardIndex(0);
            setCurrentCard(refreshedDueCards[0]);
            setShowAnswer(false);
        } else {
            setReviewComplete(true);
            setCurrentCard(null);
        }
      }
    } catch (error) {
      console.error('Failed to record review:', error);
      Alert.alert('Error', 'Failed to record review.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial loading state: session not yet started, and currently loading
  if (!sessionStarted && isLoading) {
    return <View style={styles.centered}><ActivityIndicator size=large /><Text>Loading review session for {deckName}...</Text></View>;
  }

  // Review session is complete
  if (reviewComplete) {
    return (
      <View style={styles.centered}>
        <Text style={styles.completeText}>Review session for {deckName} complete!</Text>
        <View style={styles.buttonGroup}>
            <Button title=Back to Deck onPress={() => navigation.navigate('CardList', { deckId, deckName })} />
            <Button title=Review Again onPress={() => loadDueCards(true)} />
        </View>
        <Button title=Back to All Decks onPress={() => navigation.navigate('DeckList')} />
      </View>
    );
  }

  // Session has started, not loading, but no current card (means no cards were found)
  if (!currentCard && sessionStarted && !isLoading) {
    return (
        <View style={styles.centered}>
            <Text style={styles.infoText}>No cards currently due for review in {deckName}.</Text>
            <View style={styles.buttonGroup}>
                <Button title=Back to Deck onPress={() => navigation.navigate('CardList', { deckId, deckName })} />
                <Button title=Refresh onPress={() => loadDueCards(true)} />
            </View>
             <Button title=Back to All Decks onPress={() => navigation.navigate('DeckList')} />
        </View>
    );
  }

  // If currentCard is null but we are in a loading state (e.g., after grading, before next card is set)
  if (!currentCard && isLoading) {
      return <View style={styles.centered}><ActivityIndicator size=large /><Text>Loading next card...</Text></View>;
  }

  // Fallback if currentCard is null for an unknown reason after session started and not loading
  if (!currentCard) {
      return (
        <View style={styles.centered}>
            <Text style={styles.infoText}>An unexpected error occurred or no card is available.</Text>
            <Button title=Try Again onPress={() => loadDueCards(true)} />
            <Button title=Back to All Decks onPress={() => navigation.navigate('DeckList')} />
        </View>
      );
  }

  // Main review UI
  return (
    <View style={styles.container}>
      <View style={styles.cardView}>
        <Text style={styles.deckNameText}>Deck: {deckName}</Text>
        <Text style={styles.progressText}>Card {currentCardIndex + 1} of {dueCards.length > 0 ? dueCards.length : '...'}</Text>
        <Text style={styles.frontText}>{currentCard.front}</Text>
        {showAnswer && <Text style={styles.backText}>{currentCard.back}</Text>}
      </View>

      {/* Subtle loading indicator for when a grade is being processed, separate from full screen loading */}
      {isLoading && <View style={styles.processingGradeLoader}><ActivityIndicator size=small color=#0000ff/></View>}

      {!showAnswer ? (
        <Button title=Show Answer onPress={handleShowAnswer} disabled={isLoading} />
      ) : (
        <View style={styles.gradingButtons}>
          <Button title=Again onPress={() => handleGrade(Rating.Again)} color=#FF6961 disabled={isLoading} />
          <Button title=Hard onPress={() => handleGrade(Rating.Hard)} color=#FFDA61 disabled={isLoading} />
          <Button title=Good onPress={() => handleGrade(Rating.Good)} color=#77DD77 disabled={isLoading} />
          <Button title=Easy onPress={() => handleGrade(Rating.Easy)} color=#AEC6CF disabled={isLoading} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  processingGradeLoader: { // For the small loader when a grade is submitted
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -15, // Half of width
    marginTop: -15, // Half of height
    padding: 5, // Small padding around spinner
    zIndex: 10,
  },
  cardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    minHeight: 200,
  },
  deckNameText: {
    fontSize: 14,
    color: '#888',
    position: 'absolute',
    top: 10,
    left: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
    position: 'absolute',
    top: 10,
    right: 10,
  },
  frontText: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: 'bold',
  },
  backText: {
    fontSize: 22,
    textAlign: 'center',
    color: '#333',
    marginTop:15,
  },
  gradingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    flexWrap: 'wrap',
  },
  completeText: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 25,
  },
  infoText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15,
  }
});
