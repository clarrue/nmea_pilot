import React from 'react';
import {Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {DashboardScreen} from '../screens/DashboardScreen';
import {WindScreen} from '../screens/WindScreen';
import {AutopilotScreen} from '../screens/AutopilotScreen';
import {NavigationScreen} from '../screens/NavigationScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {EngineScreen} from '../screens/EngineScreen';
import {useTheme} from '../theme/ThemeContext';

export type RootTabParamList = {
  Dashboard: undefined;
  Wind: undefined;
  Engine: undefined;
  Autopilot: undefined;
  Navigation: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function TabIcon({icon, focused, color}: {icon: string; focused: boolean; color: string}) {
  return (
    <Text style={{fontSize: 20, color}}>{icon}</Text>
  );
}

export function AppNavigator() {
  const {colors} = useTheme();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.border,
          },
          tabBarActiveTintColor: colors.tabBarActive,
          tabBarInactiveTintColor: colors.tabBarInactive,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}>
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({color, focused}) => (
              <TabIcon icon="⊞" focused={focused} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Wind"
          component={WindScreen}
          options={{
            tabBarLabel: 'Wind',
            tabBarIcon: ({color, focused}) => (
              <TabIcon icon="🌬" focused={focused} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Engine"
          component={EngineScreen}
          options={{
            tabBarLabel: 'Engine',
            tabBarIcon: ({color, focused}) => (
              <TabIcon icon="🔧" focused={focused} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Autopilot"
          component={AutopilotScreen}
          options={{
            tabBarLabel: 'Autopilot',
            tabBarIcon: ({color, focused}) => (
              <TabIcon icon="⛵" focused={focused} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Navigation"
          component={NavigationScreen}
          options={{
            tabBarLabel: 'Nav',
            tabBarIcon: ({color, focused}) => (
              <TabIcon icon="◎" focused={focused} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: ({color, focused}) => (
              <TabIcon icon="⚙" focused={focused} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
