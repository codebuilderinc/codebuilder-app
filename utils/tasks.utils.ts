import * as TaskManager from 'expo-task-manager';
let BackgroundTask: any;
try {
    // Dynamically require to avoid crashing if native module not yet installed / prebuilt
    BackgroundTask = require('expo-background-task');
} catch (e) {
    console.warn('[BackgroundTask] Module not available (dev or web?):', (e as any)?.message);
    BackgroundTask = {
        BackgroundTaskResult: { Success: 1, Failed: 2 },
        BackgroundTaskStatus: { Restricted: 1, Available: 2 },
        getStatusAsync: async () => 1,
        registerTaskAsync: async () => {},
        unregisterTaskAsync: async () => {},
    };
}

export const BACKGROUND_TASK_IDENTIFIER = 'background-fetch-task'; // legacy id retained

// Track definition across Fast Refresh cycles
let taskDefined = (globalThis as any).__CODEBUILDER_BACKGROUND_TASK_DEFINED__ === true;
function defineBackgroundTask() {
    if (taskDefined) return;
    try {
    const handler = async () => {
            try {
                const startedAt = new Date().toISOString();
                console.log('[BackgroundTask] Started', startedAt);
                const response = await fetch('https://api.codebuilder.org/jobs/fetch');
                const contentType = response.headers.get('content-type') || '';

                if (!response.ok) {
                    const text = await response.text();
                    console.error('[BackgroundTask] HTTP error', response.status, text.slice(0, 200));
                    return BackgroundTask.BackgroundTaskResult.Failed;
                }

                let data: unknown;
                if (contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    console.warn('[BackgroundTask] Non-JSON response', text.slice(0, 200));
                    data = text;
                }

                console.log('[BackgroundTask] Success fetched data snapshot type:', typeof data);
                return BackgroundTask.BackgroundTaskResult.Success;
            } catch (error) {
                console.error('[BackgroundTask] Failed', error);
                return BackgroundTask.BackgroundTaskResult.Failed;
            }
        };
        // Prefer TaskManager; some libs might also expose a define API
        if (typeof (BackgroundTask as any).defineTask === 'function') {
            try {
                (BackgroundTask as any).defineTask(BACKGROUND_TASK_IDENTIFIER, handler);
            } catch (btErr: any) {
                const m = btErr?.message || '';
                if (!/already defined/i.test(m)) {
                    console.warn('[BackgroundTask] BackgroundTask.defineTask failed, falling back to TaskManager.defineTask', m);
                }
            }
        }
        TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, handler);
        taskDefined = true;
        (globalThis as any).__CODEBUILDER_BACKGROUND_TASK_DEFINED__ = true;
        console.log('[BackgroundTask] Task definition ensured');
    } catch (e) {
        // If already defined, ignore; otherwise log
        const msg = (e as any)?.message || '';
        if (!/already defined/i.test(msg)) {
            console.warn('[BackgroundTask] defineTask error', msg);
        } else {
            taskDefined = true; // treat as defined
            (globalThis as any).__CODEBUILDER_BACKGROUND_TASK_DEFINED__ = true;
        }
    }
}

// Ensure definition at module load
defineBackgroundTask();

/**
 * Register background task (replaces deprecated expo-background-fetch).
 * minimumInterval is in MINUTES (platform minimum ~15 on Android; iOS may defer more).
 */
export async function registerBackgroundFetch(minimumIntervalMinutes: number = 15) {
    try {
        // Double-ensure task is defined before registering
        defineBackgroundTask();
    // Small delay to let task registry settle (helps with Fast Refresh race conditions)
    await new Promise(res => setTimeout(res, 25));
        const status = await BackgroundTask.getStatusAsync();
        if (status !== BackgroundTask.BackgroundTaskStatus.Available) {
            console.warn('[BackgroundTask] Not available, status=', status);
            return false;
        }
        await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER, {
            minimumInterval: Math.max(15, minimumIntervalMinutes),
        });
        console.log('[BackgroundTask] Registered (min interval minutes):', Math.max(15, minimumIntervalMinutes));
        return true;
    } catch (e) {
        const msg = (e as any)?.message || String(e);
        console.error('[BackgroundTask] Register error', msg);
        if (/not defined/i.test(msg)) {
            console.log('[BackgroundTask] Retrying after ensure definition...');
            try {
                defineBackgroundTask();
        await new Promise(res => setTimeout(res, 100));
                await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER, {
                    minimumInterval: Math.max(15, minimumIntervalMinutes),
                });
                console.log('[BackgroundTask] Registered on retry');
                return true;
            } catch (e2) {
                console.error('[BackgroundTask] Retry failed', (e2 as any)?.message || e2);
            }
        }
        return false;
    }
}

export async function unregisterBackgroundTask() {
    try {
        await BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_IDENTIFIER);
        console.log('[BackgroundTask] Unregistered');
    } catch (e) {
        console.error('[BackgroundTask] Unregister error', (e as any)?.message || e);
    }
}

// Dev helper to force run tasks (no-op in prod)
export async function triggerBackgroundTaskForTesting() {
    try {
        const triggered = await (BackgroundTask as any).triggerTaskWorkerForTestingAsync?.();
        console.log('[BackgroundTask] Trigger test invoked', triggered);
    } catch (e) {
        console.error('[BackgroundTask] Trigger test error', (e as any)?.message || e);
    }
}

export async function getBackgroundTaskRegistrationState() {
    const status = await BackgroundTask.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER);
    return { status, isRegistered };
}
