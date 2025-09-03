import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Linking, RefreshControl } from 'react-native';
import CustomHeader from '@/components/CustomHeader';

// Define types for Job and related data
interface Company {
    id: number;
    name: string;
}

interface JobTag {
    id: number;
    tag: {
        id: number;
        name: string;
    };
}

interface JobMetadata {
    id: number;
    name: string;
    value: string;
}

interface JobSource {
    id: number;
    source: string;
    externalId?: string;
    rawUrl?: string;
}

interface Job {
    id: number;
    title: string;
    company?: Company;
    author?: string;
    location?: string;
    url: string;
    postedAt?: string;
    description?: string;
    isRemote?: boolean;
    createdAt: string;
    updatedAt: string;
    tags: JobTag[];
    metadata: JobMetadata[];
    sources: JobSource[];
}

export default function JobsListView() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalPages = Math.ceil(totalCount / pageSize);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            setError(null);

            // Calculate skip value based on page
            const skipValue = (page - 1) * pageSize;

            // Log API request for debugging
            console.log(`Fetching jobs with: skip=${skipValue}, first=${pageSize}, page=${page}`);

            // Use the new API endpoint with pagination parameters
            const response = await fetch(`https://api.codebuilder.org/jobs?skip=${skipValue}&first=${pageSize}`);

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }

            const data = await response.json();

            // Log response data for debugging
            console.log(`Received ${data.jobs?.length || 0} jobs, total: ${data.totalCount || 0}`);

            setJobs(data.jobs || []);
            setTotalCount(data.totalCount || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            setPage(1); // Reset to the first page when refreshing
            await fetchJobs();
        } finally {
            setRefreshing(false);
        }
    };

    // Initialize component
    useEffect(() => {
        console.log('Component mounted, fetching initial data');
        fetchJobs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array means this only runs once on mount

    // Handle page changes
    useEffect(() => {
        if (page > 1) {
            // Skip on initial load (page 1 is already loaded)
            console.log(`Page changed to ${page}, fetching new data`);
            fetchJobs();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]); // Only run when page changes

    const handleNextPage = () => {
        if (page < totalPages) {
            console.log(`Moving to next page: ${page + 1}`);
            setPage(page + 1); // Use direct value to ensure immediate update
        }
    };

    const handlePrevPage = () => {
        if (page > 1) {
            console.log(`Moving to previous page: ${page - 1}`);
            setPage(page - 1); // Use direct value to ensure immediate update
        }
    };

    const handleOpenURL = (url: string) => {
        if (url) {
            Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
        }
    };

    // Helper function to get job metadata value by name
    const getMetadataValue = (job: Job, name: string): string | null => {
        const metadata = job.metadata.find((m) => m.name === name);
        return metadata ? metadata.value : null;
    };

    // Helper function to get job source
    const getJobSource = (job: Job): string => {
        if (job.sources && job.sources.length > 0) {
            return job.sources[0].source;
        }
        return 'Unknown';
    };

    return (
        <View style={{ flex: 1 }}>
            <CustomHeader title="Jobs" />
            <View style={styles.container}>
                <Text style={styles.title}>Jobs (Page {page})</Text>

                {loading && <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 10 }} />}

                {error && <Text style={styles.errorText}>Error: {error}</Text>}

                <ScrollView style={styles.scrollContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
                    {!loading &&
                        !error &&
                        jobs.length > 0 &&
                        jobs.map((job) => (
                            <TouchableOpacity key={job.id} style={styles.card} activeOpacity={0.8} onPress={() => handleOpenURL(job.url)}>
                                <Text style={styles.cardTitle}>{job.title}</Text>

                                <View style={styles.cardRow}>
                                    <Text style={styles.cardLabel}>Company:</Text>
                                    <Text style={styles.cardValue}>{job.company?.name || 'Unknown'}</Text>
                                </View>

                                {job.author && (
                                    <View style={styles.cardRow}>
                                        <Text style={styles.cardLabel}>Posted by:</Text>
                                        <Text style={styles.cardValue}>{job.author}</Text>
                                    </View>
                                )}

                                {job.location && (
                                    <View style={styles.cardRow}>
                                        <Text style={styles.cardLabel}>Location:</Text>
                                        <Text style={styles.cardValue}>{job.location}</Text>
                                    </View>
                                )}

                                <View style={styles.cardRow}>
                                    <Text style={styles.cardLabel}>Remote:</Text>
                                    <Text style={styles.cardValue}>{job.isRemote ? 'Yes' : 'No'}</Text>
                                </View>

                                {job.tags.length > 0 && (
                                    <View style={styles.cardRow}>
                                        <Text style={styles.cardLabel}>Skills:</Text>
                                        <Text style={styles.cardValue}>{job.tags.map((tag) => tag.tag.name).join(', ')}</Text>
                                    </View>
                                )}

                                <View style={styles.cardRow}>
                                    <Text style={styles.cardLabel}>Source:</Text>
                                    <Text style={styles.cardValue}>{getJobSource(job)}</Text>
                                </View>

                                <View style={styles.cardRow}>
                                    <Text style={styles.cardLabel}>Posted At:</Text>
                                    <Text style={styles.cardValue}>{job.postedAt ? new Date(job.postedAt).toLocaleString() : 'Unknown'}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}

                    {!loading && !error && jobs.length === 0 && <Text style={styles.noJobsText}>No jobs found</Text>}
                </ScrollView>

                <View style={styles.paginationContainer}>
                    <TouchableOpacity style={[styles.button, page === 1 && styles.disabledButton]} onPress={handlePrevPage} disabled={page === 1}>
                        <Text style={styles.buttonText}>Previous</Text>
                    </TouchableOpacity>

                    <Text style={styles.pageIndicator}>
                        Page {page} of {totalPages || 1}
                    </Text>

                    <TouchableOpacity style={[styles.button, page === totalPages && styles.disabledButton]} onPress={handleNextPage} disabled={page === totalPages}>
                        <Text style={styles.buttonText}>Next</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 5,
        paddingHorizontal: 16,
        backgroundColor: '#121212',
    },
    scrollContainer: {
        marginTop: 10,
    },
    title: {
        fontSize: 20,
        marginBottom: 10,
        fontWeight: 'bold',
        alignSelf: 'center',
        color: '#fff',
    },
    errorText: {
        color: '#ff4444',
        marginVertical: 10,
    },
    noJobsText: {
        color: '#fff',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
    card: {
        backgroundColor: '#1F1F1F',
        borderRadius: 8,
        padding: 16,
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    cardRow: {
        flexDirection: 'row',
        marginBottom: 4,
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    cardLabel: {
        marginRight: 4,
        color: '#ccc',
        fontSize: 14,
    },
    cardValue: {
        marginRight: 12,
        color: '#fff',
        fontSize: 14,
        flex: 1,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 10,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        marginHorizontal: 5,
    },
    disabledButton: {
        backgroundColor: '#555',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
    },
    pageIndicator: {
        fontSize: 16,
        marginHorizontal: 10,
        color: '#fff',
    },
});
