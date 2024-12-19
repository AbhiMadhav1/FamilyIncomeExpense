import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useUser } from '../components/UserContext';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import AppDrawer from './AppDrawer';
import AvatarScreen from '../screens/AvatarScreen';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Alert,
  BackHandler,
} from 'react-native';
import CalculatorScreen from '../components/CalculatorScreen';
import CurrencyScreen from '../screens/CurrencyScreen';
import TotalDetailsScreen from '../screens/TotalDetailsScreen';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { user, isLoading } = useUser();

  // Back button handler to prevent going back to SignIn screen
  useEffect(() => {
    const backAction = () => {
      if (user) {
        Alert.alert('Confirm Exit', 'Are you sure you want to exit the app?', [
          { text: 'Cancel', onPress: () => null, style: 'cancel' },
          { text: 'YES', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      } else {
        return false;
      }
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [user]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00796b" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={user ? 'AppDrawer' : 'SignIn'}>
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="AvatarScreen" component={AvatarScreen} />
        <Stack.Screen name="Currency" component={CurrencyScreen} />
        <Stack.Screen name="TotalDetailsScreen" component={TotalDetailsScreen} />
        <Stack.Screen name="AppDrawer" component={AppDrawer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default RootNavigator;

