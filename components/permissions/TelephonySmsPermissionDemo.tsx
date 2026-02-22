import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, PermissionsAndroid, Platform, Linking, Alert, Pressable, TextInput, ActivityIndicator, FlatList } from 'react-native';
import * as Cellular from 'expo-cellular';
import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';

// All telephony-related permissions
const TELEPHONY_PERMISSIONS = [
    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
    PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS,
    PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
    PermissionsAndroid.PERMISSIONS.WRITE_CALL_LOG,
    PermissionsAndroid.PERMISSIONS.CALL_PHONE,
    PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS,
    PermissionsAndroid.PERMISSIONS.PROCESS_OUTGOING_CALLS,
];

// All SMS-related permissions
const SMS_PERMISSIONS = [
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    PermissionsAndroid.PERMISSIONS.SEND_SMS,
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
    PermissionsAndroid.PERMISSIONS.RECEIVE_MMS,
    PermissionsAndroid.PERMISSIONS.RECEIVE_WAP_PUSH,
];

// Contacts permissions
const CONTACTS_PERMISSIONS = [
    PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
    PermissionsAndroid.PERMISSIONS.WRITE_CONTACTS,
];

interface CellularInfoData {
    allowsVoip: boolean | null;
    carrier: string | null;
    cellularGeneration: Cellular.CellularGeneration;
    isoCountryCode: string | null;
    mobileCountryCode: string | null;
    mobileNetworkCode: string | null;
    permission: any | null;
}

type Contact = Contacts.Contact;
type CallLogEntry = {
    id: string;
    number: string;
    type: string;
    date: string;
    duration: string;
};
type SmsEntry = {
    id: string;
    address: string;
    body: string;
    date: string;
    type: string;
};

const CONTACTS_PAGE_SIZE = 20;
const LIST_HEIGHT = 300;

export default function TelephonySmsPermissionDemo() {
    const [permissionStatuses, setPermissionStatuses] = useState<Record<string, string>>({});
    const [cellularInfo, setCellularInfo] = useState<CellularInfoData>({
        allowsVoip: null,
        carrier: null,
        cellularGeneration: Cellular.CellularGeneration.UNKNOWN,
        isoCountryCode: null,
        mobileCountryCode: null,
        mobileNetworkCode: null,
        permission: null,
    });
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [contactsCursor, setContactsCursor] = useState<string | undefined>(undefined);
    const [hasMoreContacts, setHasMoreContacts] = useState(true);
    const [callLogs, setCallLogs] = useState<CallLogEntry[]>([]);
    const [smsMessages, setSmsMessages] = useState<SmsEntry[]>([]);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [smsBody, setSmsBody] = useState('Test message from CodeBuilder');
    
    // Loading states
    const [loadingPermissions, setLoadingPermissions] = useState(false);
    const [loadingCellular, setLoadingCellular] = useState(false);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [loadingMoreContacts, setLoadingMoreContacts] = useState(false);
    const [loadingCallLogs, setLoadingCallLogs] = useState(false);
    const [loadingSms, setLoadingSms] = useState(false);
    const [makingCall, setMakingCall] = useState(false);
    const [sendingSms, setSendingSms] = useState(false);

    // Check permissions on mount
    useEffect(() => {
        checkAllPermissions();
        loadCellularInfo();
    }, []);

    const checkAllPermissions = async () => {
        if (Platform.OS !== 'android') {
            setPermissionStatuses({ platform: 'Only relevant on Android' });
            return;
        }
        try {
            const allPermissions = [...TELEPHONY_PERMISSIONS, ...SMS_PERMISSIONS, ...CONTACTS_PERMISSIONS];
            const results: Record<string, string> = {};
            
            for (const permission of allPermissions) {
                const granted = await PermissionsAndroid.check(permission);
                results[permission] = granted ? 'granted' : 'denied';
            }
            
            setPermissionStatuses(results);
        } catch (error) {
            console.error('Error checking permissions:', error);
        }
    };

    const loadCellularInfo = async () => {
        setLoadingCellular(true);
        try {
            const [allowsVoip, carrier, cellularGeneration, isoCountryCode, mobileCountryCode, mobileNetworkCode, permission] = await Promise.all([
                Cellular.allowsVoipAsync(),
                Cellular.getCarrierNameAsync(),
                Cellular.getCellularGenerationAsync(),
                Cellular.getIsoCountryCodeAsync(),
                Cellular.getMobileCountryCodeAsync(),
                Cellular.getMobileNetworkCodeAsync(),
                Cellular.getPermissionsAsync(),
            ]);
            setCellularInfo({ allowsVoip, carrier, cellularGeneration, isoCountryCode, mobileCountryCode, mobileNetworkCode, permission });
        } catch (error) {
            console.error('Error loading cellular info:', error);
        } finally {
            setLoadingCellular(false);
        }
    };

    const requestAllPermissions = async () => {
        if (Platform.OS !== 'android') {
            setPermissionStatuses({ platform: 'Only relevant on Android' });
            return;
        }
        setLoadingPermissions(true);
        try {
            // Request cellular permissions first
            await Cellular.requestPermissionsAsync();
            
            // Request all telephony, SMS, and contacts permissions
            const allPermissions = [...TELEPHONY_PERMISSIONS, ...SMS_PERMISSIONS, ...CONTACTS_PERMISSIONS];
            const results = await PermissionsAndroid.requestMultiple(allPermissions);
            setPermissionStatuses(results);
            
            // Refresh cellular info after permission grant
            await loadCellularInfo();
        } catch (error) {
            console.error('Error requesting permissions:', error);
        } finally {
            setLoadingPermissions(false);
        }
    };

    // Load contacts with pagination
    const loadContacts = async (loadMore = false) => {
        if (loadMore) {
            if (!hasMoreContacts || loadingMoreContacts) return;
            setLoadingMoreContacts(true);
        } else {
            setLoadingContacts(true);
            setContacts([]);
            setContactsCursor(undefined);
            setHasMoreContacts(true);
        }

        try {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
                const options: any = {
                    fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
                    pageSize: CONTACTS_PAGE_SIZE,
                };

                if (loadMore && contactsCursor) {
                    options.pageOffset = contactsCursor;
                }

                const { data, hasNextPage, hasPreviousPage } = await Contacts.getContactsAsync(options);
                
                if (loadMore) {
                    setContacts(prev => [...prev, ...data]);
                } else {
                    setContacts(data);
                }

                setHasMoreContacts(hasNextPage);
                if (data.length > 0) {
                    setContactsCursor(data[data.length - 1].id);
                }
            } else {
                Alert.alert('Permission Denied', 'Contact permission is required to view contacts.');
            }
        } catch (error) {
            console.error('Error loading contacts:', error);
            Alert.alert('Error', 'Failed to load contacts');
        } finally {
            if (loadMore) {
                setLoadingMoreContacts(false);
            } else {
                setLoadingContacts(false);
            }
        }
    };

    // Read call logs - Note: This requires a native module in production
    const loadCallLogs = async () => {
        if (Platform.OS !== 'android') {
            Alert.alert('Not Available', 'Call logs are only available on Android');
            return;
        }
        setLoadingCallLogs(true);
        try {
            const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CALL_LOG);
            if (!granted) {
                Alert.alert('Permission Required', 'READ_CALL_LOG permission is required. Please request permissions first.');
                return;
            }

            // Note: In production, use react-native-call-log or similar
            Alert.alert('Native Module Required', 'Reading actual call logs requires a native module like react-native-call-log. This is demo data.');
            setCallLogs([
                { id: '1', number: '+1234567890', type: 'INCOMING', date: new Date(Date.now() - 3600000).toISOString(), duration: '120' },
                { id: '2', number: '+0987654321', type: 'OUTGOING', date: new Date(Date.now() - 7200000).toISOString(), duration: '45' },
                { id: '3', number: '+1122334455', type: 'MISSED', date: new Date(Date.now() - 86400000).toISOString(), duration: '0' },
            ]);
        } catch (error) {
            console.error('Error loading call logs:', error);
        } finally {
            setLoadingCallLogs(false);
        }
    };

    // Read SMS messages - Note: This requires a native module in production
    const loadSmsMessages = async () => {
        if (Platform.OS !== 'android') {
            Alert.alert('Not Available', 'SMS reading is only available on Android');
            return;
        }
        setLoadingSms(true);
        try {
            const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
            if (!granted) {
                Alert.alert('Permission Required', 'READ_SMS permission is required. Please request permissions first.');
                return;
            }

            // Note: In production, use react-native-get-sms-android or similar
            Alert.alert('Native Module Required', 'Reading actual SMS requires a native module like react-native-get-sms-android. This is demo data.');
            setSmsMessages([
                { id: '1', address: '+1234567890', body: 'Hello there!', date: new Date(Date.now() - 3600000).toISOString(), type: 'INBOX' },
                { id: '2', address: '+0987654321', body: 'Test message', date: new Date(Date.now() - 7200000).toISOString(), type: 'SENT' },
                { id: '3', address: '+1122334455', body: 'Meeting at 3pm', date: new Date(Date.now() - 86400000).toISOString(), type: 'INBOX' },
            ]);
        } catch (error) {
            console.error('Error loading SMS:', error);
        } finally {
            setLoadingSms(false);
        }
    };

    // Make a phone call
    const makeCall = async () => {
        if (!phoneNumber.trim()) {
            Alert.alert('Error', 'Please enter a phone number');
            return;
        }
        setMakingCall(true);
        try {
            // Use tel: URL scheme - this will open the dialer
            const url = `tel:${phoneNumber}`;
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', 'Cannot make phone calls on this device');
            }
        } catch (error) {
            console.error('Error making call:', error);
            Alert.alert('Error', 'Failed to initiate call');
        } finally {
            setMakingCall(false);
        }
    };

    // Send SMS using expo-sms
    const sendSms = async () => {
        if (!phoneNumber.trim()) {
            Alert.alert('Error', 'Please enter a phone number');
            return;
        }
        setSendingSms(true);
        try {
            const isAvailable = await SMS.isAvailableAsync();
            if (isAvailable) {
                const { result } = await SMS.sendSMSAsync([phoneNumber], smsBody);
                if (result === 'sent') {
                    Alert.alert('Success', 'SMS sent successfully');
                } else {
                    Alert.alert('Cancelled', 'SMS sending was cancelled');
                }
            } else {
                Alert.alert('Not Available', 'SMS is not available on this device');
            }
        } catch (error) {
            console.error('Error sending SMS:', error);
            Alert.alert('Error', 'Failed to send SMS');
        } finally {
            setSendingSms(false);
        }
    };

    const getCellularGenerationName = (gen: Cellular.CellularGeneration) => {
        switch (gen) {
            case 0: return 'Unknown';
            case 1: return '2G';
            case 2: return '3G';
            case 3: return '4G';
            case 4: return '5G';
            default: return 'Unknown';
        }
    };

    const renderContactItem = ({ item }: { item: Contact }) => (
        <View style={styles.listItem}>
            <Text style={styles.listItemTitle}>{item.name || 'No Name'}</Text>
            {item.phoneNumbers && item.phoneNumbers.length > 0 && (
                <Text style={styles.listItemSubtitle}>{item.phoneNumbers[0].number}</Text>
            )}
        </View>
    );

    const renderCallLogItem = ({ item }: { item: CallLogEntry }) => (
        <View style={styles.listItem}>
            <Text style={styles.listItemTitle}>{item.number}</Text>
            <Text style={styles.listItemSubtitle}>
                {item.type} • Duration: {item.duration}s • {new Date(item.date).toLocaleString()}
            </Text>
        </View>
    );

    const renderSmsItem = ({ item }: { item: SmsEntry }) => (
        <View style={styles.listItem}>
            <Text style={styles.listItemTitle}>{item.address}</Text>
            <Text style={styles.listItemSubtitle} numberOfLines={2}>
                {item.body}
            </Text>
            <Text style={styles.listItemMeta}>{item.type} • {new Date(item.date).toLocaleString()}</Text>
        </View>
    );

    const renderContactsFooter = () => {
        if (!loadingMoreContacts) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#61dafb" />
                <Text style={styles.footerLoaderText}>Loading more contacts...</Text>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <Text style={styles.title}>Telephony, SMS & Contacts</Text>
            <Text style={styles.copy}>
                This page combines cellular information, telephony permissions, SMS capabilities, contacts access, and call log functionality.
                Request all permissions to unlock full functionality.
            </Text>

            {/* Main Permission Request Button */}
            <Pressable 
                style={[styles.mainButton, loadingPermissions && styles.buttonDisabled]} 
                onPress={requestAllPermissions} 
                disabled={loadingPermissions}
            >
                {loadingPermissions ? (
                    <View style={styles.buttonContent}>
                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.mainButtonText}>Requesting Permissions...</Text>
                    </View>
                ) : (
                    <Text style={styles.mainButtonText}>🔐 Request All Permissions</Text>
                )}
            </Pressable>

            {/* Permission Statuses */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 Permission Statuses</Text>
                {Object.keys(permissionStatuses).length === 0 ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#61dafb" />
                        <Text style={styles.statusText}>Checking permissions...</Text>
                    </View>
                ) : (
                    Object.entries(permissionStatuses).map(([key, value]) => (
                        <View style={styles.permissionRow} key={key}>
                            <Text style={styles.permissionName}>{key.split('.').pop()}</Text>
                            <Text style={[styles.permissionValue, value === 'granted' ? styles.granted : styles.denied]}>{value}</Text>
                        </View>
                    ))
                )}
            </View>

            {/* Cellular Information */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📱 Cellular Information</Text>
                <View style={styles.infoGrid}>
                    <InfoRow label="Carrier" value={cellularInfo.carrier || 'N/A'} />
                    <InfoRow label="Network Generation" value={getCellularGenerationName(cellularInfo.cellularGeneration)} />
                    <InfoRow label="Allows VoIP" value={cellularInfo.allowsVoip !== null ? String(cellularInfo.allowsVoip) : 'N/A'} />
                    <InfoRow label="ISO Country Code" value={cellularInfo.isoCountryCode || 'N/A'} />
                    <InfoRow label="Mobile Country Code" value={cellularInfo.mobileCountryCode || 'N/A'} />
                    <InfoRow label="Mobile Network Code" value={cellularInfo.mobileNetworkCode || 'N/A'} />
                    <InfoRow label="Permission Status" value={cellularInfo.permission?.status || 'N/A'} />
                </View>
                <Pressable 
                    style={[styles.actionButton, styles.refreshButton, loadingCellular && styles.buttonDisabled]}
                    onPress={loadCellularInfo}
                    disabled={loadingCellular}
                >
                    {loadingCellular ? (
                        <View style={styles.buttonContent}>
                            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.actionButtonText}>Refreshing...</Text>
                        </View>
                    ) : (
                        <Text style={styles.actionButtonText}>🔄 Refresh Cellular Info</Text>
                    )}
                </Pressable>
            </View>

            {/* Phone Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📞 Phone Actions</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter phone number"
                    placeholderTextColor="#666"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                />
                <View style={styles.buttonRow}>
                    <Pressable 
                        style={[styles.actionButton, styles.callButton, makingCall && styles.buttonDisabled]} 
                        onPress={makeCall}
                        disabled={makingCall}
                    >
                        {makingCall ? (
                            <View style={styles.buttonContent}>
                                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 4 }} />
                                <Text style={styles.actionButtonText}>Calling...</Text>
                            </View>
                        ) : (
                            <Text style={styles.actionButtonText}>📞 Call</Text>
                        )}
                    </Pressable>
                    <Pressable 
                        style={[styles.actionButton, styles.smsButton, sendingSms && styles.buttonDisabled]} 
                        onPress={sendSms}
                        disabled={sendingSms}
                    >
                        {sendingSms ? (
                            <View style={styles.buttonContent}>
                                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 4 }} />
                                <Text style={styles.actionButtonText}>Sending...</Text>
                            </View>
                        ) : (
                            <Text style={styles.actionButtonText}>💬 SMS</Text>
                        )}
                    </Pressable>
                </View>
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    placeholder="SMS message body"
                    placeholderTextColor="#666"
                    value={smsBody}
                    onChangeText={setSmsBody}
                    multiline
                />
            </View>

            {/* Contacts */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>👥 Contacts</Text>
                <Pressable 
                    style={[styles.actionButton, styles.contactsButton, loadingContacts && styles.buttonDisabled]}
                    onPress={() => loadContacts(false)}
                    disabled={loadingContacts}
                >
                    {loadingContacts ? (
                        <View style={styles.buttonContent}>
                            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.actionButtonText}>Loading Contacts...</Text>
                        </View>
                    ) : (
                        <Text style={styles.actionButtonText}>📖 Load Contacts</Text>
                    )}
                </Pressable>
                {contacts.length > 0 && (
                    <View style={styles.flatListContainer}>
                        <FlatList
                            data={contacts}
                            renderItem={renderContactItem}
                            keyExtractor={(item, index) => item.id ?? `contact-${index}`}
                            style={styles.flatList}
                            onEndReached={() => loadContacts(true)}
                            onEndReachedThreshold={0.5}
                            ListFooterComponent={renderContactsFooter}
                        />
                    </View>
                )}
            </View>

            {/* Call Logs */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 Call Logs</Text>
                <Pressable 
                    style={[styles.actionButton, styles.callLogsButton, loadingCallLogs && styles.buttonDisabled]}
                    onPress={loadCallLogs}
                    disabled={loadingCallLogs}
                >
                    {loadingCallLogs ? (
                        <View style={styles.buttonContent}>
                            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.actionButtonText}>Loading Call Logs...</Text>
                        </View>
                    ) : (
                        <Text style={styles.actionButtonText}>📜 Load Call Logs</Text>
                    )}
                </Pressable>
                {callLogs.length > 0 && (
                    <View style={styles.flatListContainer}>
                        <FlatList
                            data={callLogs}
                            renderItem={renderCallLogItem}
                            keyExtractor={(item) => item.id}
                            style={styles.flatList}
                        />
                    </View>
                )}
            </View>

            {/* SMS Messages */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>💬 SMS Messages</Text>
                <Pressable 
                    style={[styles.actionButton, styles.smsMessagesButton, loadingSms && styles.buttonDisabled]}
                    onPress={loadSmsMessages}
                    disabled={loadingSms}
                >
                    {loadingSms ? (
                        <View style={styles.buttonContent}>
                            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.actionButtonText}>Loading SMS...</Text>
                        </View>
                    ) : (
                        <Text style={styles.actionButtonText}>📨 Load SMS Messages</Text>
                    )}
                </Pressable>
                {smsMessages.length > 0 && (
                    <View style={styles.flatListContainer}>
                        <FlatList
                            data={smsMessages}
                            renderItem={renderSmsItem}
                            keyExtractor={(item) => item.id}
                            style={styles.flatList}
                        />
                    </View>
                )}
            </View>

            {/* Notes */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>📝 Notes</Text>
                <Text style={styles.noteText}>
                    • Telephony permissions require Play Store declarations{'\n'}
                    • Call log and SMS reading require native modules in production{'\n'}
                    • Some features may not work on emulators{'\n'}
                    • SMS/Call permissions are highly restricted by Google Play{'\n'}
                    • Phone calls and SMS will open device default apps
                </Text>
            </View>
        </ScrollView>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    content: { padding: 16, paddingBottom: 40 },
    title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
    copy: { color: '#aaa', fontSize: 14, lineHeight: 20, marginBottom: 16 },
    mainButton: {
        backgroundColor: '#2196F3',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    mainButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    buttonDisabled: { opacity: 0.6 },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
    },
    section: {
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    sectionTitle: { color: '#61dafb', fontSize: 16, fontWeight: '700', marginBottom: 12 },
    permissionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    permissionName: { color: '#ccc', fontSize: 12, flex: 1 },
    permissionValue: { fontSize: 12, fontWeight: '600' },
    granted: { color: '#4CAF50' },
    denied: { color: '#f44336' },
    statusText: { color: '#666', fontSize: 14 },
    infoGrid: { marginBottom: 12 },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    infoLabel: { color: '#888', fontSize: 14 },
    infoValue: { color: '#fff', fontSize: 14, fontWeight: '500' },
    input: {
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        padding: 12,
        color: '#fff',
        fontSize: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    actionButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    callButton: { backgroundColor: '#4CAF50' },
    smsButton: { backgroundColor: '#2196F3' },
    refreshButton: { backgroundColor: '#61dafb' },
    contactsButton: { backgroundColor: '#4CAF50', marginBottom: 12 },
    callLogsButton: { backgroundColor: '#FF9800', marginBottom: 12 },
    smsMessagesButton: { backgroundColor: '#9C27B0', marginBottom: 12 },
    actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    flatListContainer: {
        height: LIST_HEIGHT,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        overflow: 'hidden',
    },
    flatList: {
        flex: 1,
    },
    listItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    listItemTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
    listItemSubtitle: { color: '#888', fontSize: 12, marginTop: 4 },
    listItemMeta: { color: '#666', fontSize: 10, marginTop: 4 },
    footerLoader: {
        padding: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    footerLoaderText: { color: '#61dafb', fontSize: 12 },
    noteText: { color: '#888', fontSize: 12, lineHeight: 20 },
});
