import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, usePathname, useRouter } from 'expo-router';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
    return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <Tabs
            screenOptions={{
                //tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                // Force header to be completely hidden for all tabs
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    // We'll handle headers manually in each screen component
                    tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="code" color={color} />,
                }}
            />
            <Tabs.Screen
                name="jobs"
                options={{
                    title: 'Jobs',
                    tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="briefcase" color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="cog" color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="user" color={color} />,
                }}
            />
            <Tabs.Screen
                name="permissions"
                options={{
                    title: 'Permissions',
                    tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="shield" color={color} />,
                }}
                listeners={{
                    tabPress: (e: { preventDefault: () => void }) => {
                        // If already on a permissions sub-page (not the index), navigate to permissions index
                        const isOnPermissionsSubPage = pathname.startsWith('/permissions/') && pathname !== '/permissions';

                        if (isOnPermissionsSubPage) {
                            // Prevent default tab behavior
                            e.preventDefault();
                            // Navigate to permissions index, replacing the current route to reset the stack
                            router.replace('/(tabs)/permissions');
                        }
                    },
                }}
            />
        </Tabs>
    );
}
