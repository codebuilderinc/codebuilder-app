import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSessionUser, useSession } from '@/providers/SessionProvider';
import { BACKGROUND_TASK_IDENTIFIER, getBackgroundTaskRegistrationState, registerBackgroundFetch, unregisterBackgroundTask, triggerBackgroundTaskForTesting } from '@/utils/tasks.utils';

interface BgState {
  status: number | null;
  isRegistered: boolean;
  loading: boolean;
  lastAction?: string;
}

export default function DebugScreen() {
  const { fcmToken, authReady, fcmReady, user, accessToken } = useSessionUser();
  const { session } = useSession();
  const [bg, setBg] = useState<BgState>({ status: null, isRegistered: false, loading: false });

  const refresh = useCallback(async () => {
    setBg((s) => ({ ...s, loading: true }));
    try {
      const r = await getBackgroundTaskRegistrationState();
      setBg((s) => ({ ...s, ...r, loading: false }));
    } catch (e) {
      setBg((s) => ({ ...s, loading: false, lastAction: 'refresh failed' }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const register = async () => {
    setBg((s) => ({ ...s, loading: true }));
    await registerBackgroundFetch();
    await refresh();
    setBg((s) => ({ ...s, lastAction: 'registered' }));
  };
  const unregister = async () => {
    setBg((s) => ({ ...s, loading: true }));
    await unregisterBackgroundTask();
    await refresh();
    setBg((s) => ({ ...s, lastAction: 'unregistered' }));
  };
  const trigger = async () => {
    setBg((s) => ({ ...s, lastAction: 'triggering' }));
    await triggerBackgroundTaskForTesting();
  };

  const tokenTail = fcmToken ? fcmToken.slice(-10) : 'none';

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Debug</Text>
      <Section title="Session">
        <Mono label="FCM Ready" value={String(fcmReady)} />
        <Mono label="Auth Ready" value={String(authReady)} />
        <Mono label="FCM Token Tail" value={tokenTail} />
        <Mono label="User Email" value={user?.email || '—'} />
        <Mono label="Access Token" value={accessToken ? accessToken.slice(0, 15) + '…' : '—'} />
      </Section>
      <Section title="Raw Session Snapshot">
        <Text style={styles.code}>{JSON.stringify(session, null, 2)}</Text>
      </Section>
      <Section title="Background Task">
        <Mono label="Identifier" value={BACKGROUND_TASK_IDENTIFIER} />
        <Mono label="Status" value={bg.status === null ? '—' : String(bg.status)} />
        <Mono label="Registered" value={String(bg.isRegistered)} />
        <Mono label="Last Action" value={bg.lastAction || '—'} />
        <View style={styles.rowWrap}>
          <Btn label="Refresh" onPress={refresh} disabled={bg.loading} />
          <Btn label="Register" onPress={register} disabled={bg.loading || bg.isRegistered} />
            <Btn label="Unregister" onPress={unregister} disabled={bg.loading || !bg.isRegistered} />
          <Btn label="Trigger(dev)" onPress={trigger} />
        </View>
      </Section>
      <Text style={styles.footer}>Build Debug Utilities v1</Text>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Mono({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

function Btn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[styles.btn, disabled && styles.btnDisabled]}
      android_ripple={{ color: '#222' }}
    >
      <Text style={styles.btnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  content: { padding: 16, paddingBottom: 48 },
  h1: { fontSize: 26, fontWeight: '600', color: '#fff', marginBottom: 12 },
  section: { marginBottom: 24, backgroundColor: '#111', borderRadius: 8, padding: 12 },
  sectionTitle: { color: '#9acd32', fontWeight: '600', fontSize: 16, marginBottom: 8 },
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  kvLabel: { color: '#bbb', fontSize: 13 },
  kvValue: { color: '#fff', fontFamily: 'monospace', fontSize: 13, flexShrink: 1, textAlign: 'right' },
  code: { color: '#8f8', fontFamily: 'monospace', fontSize: 12 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  btn: { backgroundColor: '#222', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, marginRight: 8, marginBottom: 8 },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  footer: { textAlign: 'center', color: '#444', fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  debugButton: { marginLeft: 12, backgroundColor: '#333', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 6, justifyContent: 'center' },
  debugButtonText: { color: '#fff', fontWeight: '600' },
});
