import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

const BACKGROUND_FETCH_TASK = 'background-fetch-task';

// Define the task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    try {
        console.log('----------------------- Background fetch task started ---------------------');
        // Perform your API request
        const response = await fetch('https://api.codebuilder.org/jobs/fetch');
        const contentType = response.headers.get('content-type') || '';

        if (!response.ok) {
            const text = await response.text();
            console.error('Background fetch HTTP error', response.status, text.slice(0, 200));
            return BackgroundFetch.BackgroundFetchResult.Failed;
        }

        let data: unknown;
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.warn('Background fetch received non-JSON response:', text.slice(0, 200));
            data = text;
        }

        // Handle the fetched data
        console.log('Fetched data:', data);

        return BackgroundFetch.BackgroundFetchResult.NewData; // Task succeeded
    } catch (error) {
        console.error('Background fetch failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed; // Task failed
    }
});

// Register the task
export async function registerBackgroundFetch() {
    const status = await BackgroundFetch.getStatusAsync();
    if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
            minimumInterval: 60, // Fetch interval in seconds (not guaranteed to be exact)
            stopOnTerminate: false, // Continue task when app is closed
            startOnBoot: true, // Start task when device is rebooted
        });
        console.log('Background fetch task registered');
    } else {
        console.error('Background fetch is not available');
    }
}
