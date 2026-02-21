import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/Auth/SplashScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import RoleSelectionScreen from '../screens/Auth/RoleSelectionScreen';
import StudentHomeScreen from '../screens/Student/StudentHomeScreen';
import LandlordHomeScreen from '../screens/Landlord/LandlordHomeScreen';
import AddListingScreen from '../screens/Landlord/AddListingScreen';
import DiscoverScreen from '../screens/Student/DiscoverScreen';
import FavoritesScreen from '../screens/Student/FavoritesScreen';
import StudentChatScreen from '../screens/Student/StudentChatScreen';
import ProfileScreen from '../screens/Common/ProfileScreen';
import ListingDetailScreen from '../screens/Student/ListingDetailScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="StudentHome" component={StudentHomeScreen} />
        <Stack.Screen name="LandlordHome" component={LandlordHomeScreen} />
        <Stack.Screen name="AddListing" component={AddListingScreen} />
        <Stack.Screen name="Discover" component={DiscoverScreen} />
        <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} />
        <Stack.Screen name="Messages" component={StudentChatScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
