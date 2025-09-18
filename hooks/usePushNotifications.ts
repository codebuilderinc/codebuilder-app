import { useEffect } from 'react';
import { handleForegroundNotification, handleBackgroundNotifications } from '../utils/notifications.utils';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useSession } from '@/providers/SessionProvider';

export const usePushNotifications = () => {
    const { session } = useSession();
    useEffect(() => {
        const unsubscribe = handleForegroundNotification();
        handleBackgroundNotifications();
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldPlaySound: true,
                shouldSetBadge: true,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });
        return () => unsubscribe();
    }, []);
    return { fcmToken: session.fcmToken };
};

// Deprecated legacy getter (maintained for compatibility, returns null now)
// Removed legacy getter entirely to avoid accidental misuse

export const useNotificationObserver = () => {
    useEffect(() => {
        const redirectToUrl = (notification: Notifications.Notification) => {
            const url = notification.request.content.data?.url;
            if (typeof url === 'string') {
                router.push(url as any);
            }
        };

        Notifications.getLastNotificationResponseAsync().then((response) => {
            if (response?.notification) {
                redirectToUrl(response.notification);
            }
        });

        const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
            redirectToUrl(response.notification);
        });

        return () => {
            subscription.remove();
        };
    }, []);
};
