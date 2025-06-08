import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { initDB } from './src/db/database';

export default function App() {
  const [dbInitialized, setDbInitialized] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Initializing DB from App.tsx...');
        await initDB();
        console.log('DB Initialized successfully from App.tsx.');
        setDbInitialized(true);
      } catch (e: any) {
        console.error('Failed to initialize DB from App.tsx:', e);
        setError(e.message || 'Unknown error during DB initialization');
      }
    };
    initialize();
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text>Error initializing database:</Text>
        <Text>{error}</Text>
      </View>
    );
  }

  if (!dbInitialized) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Initializing Database...</Text>
      </View>
    );
  }

  return <AppNavigator />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
