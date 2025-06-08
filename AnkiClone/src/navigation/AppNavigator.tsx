import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import DeckListScreen from '../screens/DeckListScreen';
import CreateDeckScreen from '../screens/CreateDeckScreen';
import CardListScreen from '../screens/CardListScreen';
import CreateEditCardScreen from '../screens/CreateEditCardScreen';
import ReviewScreen from '../screens/ReviewScreen'; // Import ReviewScreen

export type RootStackParamList = {
  DeckList: undefined;
  CreateDeck: undefined;
  CardList: { deckId: number; deckName: string };
  CreateEditCard: { deckId: number; cardId?: number; front?: string; back?: string };
  Review: { deckId: number; deckName: string }; // Added Review route
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="DeckList">
        <Stack.Screen name="DeckList" component={DeckListScreen} options={{ title: 'Decks' }} />
        <Stack.Screen name="CreateDeck" component={CreateDeckScreen} options={{ title: 'Create New Deck' }} />
        <Stack.Screen name="CardList" component={CardListScreen} options={({ route }) => ({ title: `${route.params.deckName} - Cards` })} />
        <Stack.Screen name="CreateEditCard" component={CreateEditCardScreen} options={({ route }) => ({ title: route.params.cardId ? 'Edit Card' : 'Create Card' })} />
        <Stack.Screen name="Review" component={ReviewScreen} options={({ route }) => ({ title: `Review: ${route.params.deckName}` })} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
