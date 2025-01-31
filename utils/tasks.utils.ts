import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";

const BACKGROUND_FETCH_TASK = "background-fetch-task";

// Define the task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    // Perform your API request
    const response = await fetch("https://api.example.com/data");
    const data = await response.json();

    // Handle the fetched data
    console.log("Fetched data:", data);

    return BackgroundFetch.Result.NewData; // Task succeeded
  } catch (error) {
    console.error("Background fetch failed:", error);
    return BackgroundFetch.Result.Failed; // Task failed
  }
});

// Register the task
async function registerBackgroundFetch() {
  const status = await BackgroundFetch.getStatusAsync();
  if (status === BackgroundFetch.Status.Available) {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60, // Fetch interval in seconds (not guaranteed to be exact)
      stopOnTerminate: false, // Continue task when app is closed
      startOnBoot: true, // Start task when device is rebooted
    });
    console.log("Background fetch task registered");
  } else {
    console.error("Background fetch is not available");
  }
}

registerBackgroundFetch();
