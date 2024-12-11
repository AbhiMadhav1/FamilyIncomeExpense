import React from 'react';
import {StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import RootNavigator from './src/navigation';
import {UserProvider} from './src/components/UserContext';

const App = () => {
  return (
    <UserProvider>
      <SafeAreaView style={styles.container}>
        <RootNavigator />
      </SafeAreaView>
    </UserProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
