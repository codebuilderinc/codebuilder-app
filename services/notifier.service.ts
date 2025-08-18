// A minimal pub/sub notifier for in-app banners (non-blocking)
// Allows triggering notifications from anywhere (including non-React files)

export type NotifierType = 'info' | 'success' | 'warning' | 'error';

export type NotifyPayload = {
    id?: string;
    type?: NotifierType;
    title?: string;
    message: string;
    duration?: number; // ms
};

type InternalNotify = Required<Omit<NotifyPayload, 'id'>> & { id: string };

type Subscriber = (n: InternalNotify) => void;

const subscribers = new Set<Subscriber>();
const defaultDuration = 5000;
const recentMap = new Map<string, number>();
const dedupeWindowMs = 2000; // ignore duplicates in this window

export function subscribe(sub: Subscriber) {
    subscribers.add(sub);
    return () => subscribers.delete(sub);
}

export function notify(payload: NotifyPayload): string | null {
    const id = payload.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const type = payload.type ?? 'error';
    const title = payload.title ?? (type === 'error' ? 'Unexpected Error' : 'Notice');
    const message = payload.message;
    const duration = payload.duration ?? defaultDuration;

    if (!message) return null;

    const key = `${type}|${title}|${message}`;
    const now = Date.now();
    const last = recentMap.get(key) ?? 0;
    if (now - last < dedupeWindowMs) return null; // drop duplicate spam
    recentMap.set(key, now);

    const data: InternalNotify = { id, type, title, message, duration };
    subscribers.forEach((s) => s(data));
    return id;
}

export function notifyError(err: unknown, fallback = 'An unexpected error occurred.') {
    const message = normalizeError(err) || fallback;
    return notify({ type: 'error', title: 'Unexpected Error', message });
}

function normalizeError(err: unknown): string | null {
    if (!err) return null;
    if (err instanceof Error) return err.message || String(err);
    if (typeof err === 'string') return err;
    try {
        return JSON.stringify(err);
    } catch {
        return String(err);
    }
}
