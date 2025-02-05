import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Linking,
  RefreshControl,
} from "react-native";

export default function PaginatedPostsCards() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10); // Customize page size here
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // Add refreshing state
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://new.codebuilder.org/api/reddit/posts?page=${page}&pageSize=${pageSize}`
      );
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();

      setPosts(data.data || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setPage(1); // Reset to the first page when refreshing
      await fetchPosts();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  const handleOpenURL = (url: string) => {
    if (url) {
      Linking.openURL(url).catch((err) =>
        console.error("Failed to open URL:", err)
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reddit Posts (Page {page})</Text>

      {loading && (
        <ActivityIndicator
          size="large"
          color="#fff"
          style={{ marginVertical: 10 }}
        />
      )}

      {error && <Text style={styles.errorText}>Error: {error}</Text>}

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {!loading &&
          !error &&
          posts.length > 0 &&
          posts.map((post: any) => (
            <TouchableOpacity
              key={post.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => handleOpenURL(post.url)}
            >
              <Text style={styles.cardTitle}>{post.title}</Text>
              <Text style={styles.cardSubtitle}>by {post.author}</Text>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Subreddit:</Text>
                <Text style={styles.cardValue}>{post.subreddit}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Upvotes:</Text>
                <Text style={styles.cardValue}>{post.upvotes}</Text>
                <Text style={styles.cardLabel}>Downvotes:</Text>
                <Text style={styles.cardValue}>{post.downvotes}</Text>
              </View>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Posted At:</Text>
                <Text style={styles.cardValue}>
                  {new Date(post.postedAt).toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
      </ScrollView>

      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.button, page === 1 && styles.disabledButton]}
          onPress={handlePrevPage}
          disabled={page === 1}
        >
          <Text style={styles.buttonText}>Previous</Text>
        </TouchableOpacity>

        <Text style={styles.pageIndicator}>
          Page {page} of {totalPages || 1}
        </Text>

        <TouchableOpacity
          style={[styles.button, page === totalPages && styles.disabledButton]}
          onPress={handleNextPage}
          disabled={page === totalPages}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 5,
    paddingHorizontal: 16,
    backgroundColor: "#121212",
  },
  scrollContainer: {
    marginTop: 10,
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: "bold",
    alignSelf: "center",
    color: "#fff",
  },
  errorText: {
    color: "#ff4444",
    marginVertical: 10,
  },
  card: {
    backgroundColor: "#1F1F1F",
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "center",
  },
  cardLabel: {
    marginRight: 4,
    color: "#ccc",
    fontSize: 14,
  },
  cardValue: {
    marginRight: 12,
    color: "#fff",
    fontSize: 14,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 5,
  },
  disabledButton: {
    backgroundColor: "#555",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  pageIndicator: {
    fontSize: 16,
    marginHorizontal: 10,
    color: "#fff",
  },
});
