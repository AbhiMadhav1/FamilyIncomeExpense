import React from 'react';
import HomeScreen from '../screens/Dashboard';
import {createDrawerNavigator} from '@react-navigation/drawer';
import CustomDrawerContent from '../components/CustomDrawerContent';
import Dashboard from '../screens/Dashboard';
import ProfileScreen from '../screens/ProfileScreen';
import AboutScreen from '../screens/AboutScreen';
import CurrencyScreen from '../screens/CurrencyScreen';
import MemberReport from '../screens/MemberReport';
// import ProfileScreen from '../screens/ProfileScreen';
// import CurrencyScreen from '../screens/CurrencyScreen';

const Drawer = createDrawerNavigator();

const AppDrawer = () => {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Drawer.Screen name="Dashboard" component={Dashboard} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="About" component={AboutScreen} />
      <Drawer.Screen name="Currency" component={CurrencyScreen} />
      <Drawer.Screen name="MemberReport" component={MemberReport} />
      {/* <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Currency" component={CurrencyScreen} /> */}
    </Drawer.Navigator>
  );
};

export default AppDrawer;
