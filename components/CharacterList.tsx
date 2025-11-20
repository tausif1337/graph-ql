import {
  FlatList,
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@apollo/client/react";
import { GET_CHARACTERS_PAGINATED } from "../queries/characters";
import { useAppContext } from "../context/AppContext";

type Character = {
  id: string;
  name: string;
  image: string;
};

type CharactersData = {
  characters: {
    info: {
      pages: number;
      next: number | null;
      prev: number | null;
    };
    results: Character[];
  };
};

export default function CharacterList() {
  const {
    currentPage,
    setCurrentPage,
  } = useAppContext();

  const { data, loading, error, refetch } = useQuery<CharactersData>(
    GET_CHARACTERS_PAGINATED,
    {
      variables: {
        page: currentPage,
      },
      errorPolicy: "all",
    }
  );

  const characters = data?.characters?.results || [];
  const info = data?.characters?.info;

  const maxPages = 2;

  const hasNext = info?.next !== null && currentPage < maxPages;
  const hasPrev = info?.prev !== null;

  if (loading && !data) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Rick & Morty</Text>
          <Text style={styles.headerSubtitle}>Character Explorer</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#8b9dc3" />
          <Text style={styles.loadingText}>Loading characters...</Text>
        </View>
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Rick & Morty</Text>
          <Text style={styles.headerSubtitle}>Character Explorer</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error.message}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rick & Morty</Text>
        <Text style={styles.headerSubtitle}>Character Explorer</Text>
      </View>

      <FlatList
        data={characters}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
            
            <View style={styles.content}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            </View>
          </View>
        )}
      />

      {info && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.paginationButton, !hasPrev && styles.paginationButtonDisabled]}
            onPress={() => {
              if (hasPrev && info.prev) {
                setCurrentPage(info.prev);
              }
            }}
            disabled={!hasPrev}
            activeOpacity={0.7}
          >
            <Text style={[styles.paginationButtonText, !hasPrev && styles.paginationButtonTextDisabled]}>
              ← Previous
            </Text>
          </TouchableOpacity>

          <View style={styles.pageIndicator}>
            <Text style={styles.pageText}>
              {currentPage} / {maxPages}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.paginationButton, !hasNext && styles.paginationButtonDisabled]}
            onPress={() => {
              if (hasNext && currentPage < maxPages) {
                setCurrentPage(currentPage + 1);
              }
            }}
            disabled={!hasNext}
            activeOpacity={0.7}
          >
            <Text style={[styles.paginationButtonText, !hasNext && styles.paginationButtonTextDisabled]}>
              Next →
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0e27",
  },
  
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#0a0e27",
  },
  
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8b9dc3",
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  
  card: {
    backgroundColor: "#1a1f3a",
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  
  image: {
    width: "100%",
    height: 280,
    resizeMode: "cover",
  },
  
  content: {
    padding: 20,
  },
  
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  
  pagination: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
    backgroundColor: "#0a0e27",
    borderTopWidth: 1,
    borderTopColor: "#1a1f3a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  
  paginationButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2a2f4a",
    minWidth: 100,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  paginationButtonDisabled: {
    backgroundColor: "#1a1f3a",
    opacity: 0.5,
  },
  
  paginationButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  
  paginationButtonTextDisabled: {
    color: "#8b9dc3",
  },
  
  pageIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#1a1f3a",
  },
  
  pageText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8b9dc3",
  },
  
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#8b9dc3",
    fontWeight: "500",
  },
  
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 12,
    textAlign: "center",
  },
  
  errorText: {
    fontSize: 16,
    color: "#8b9dc3",
    marginBottom: 24,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  
  retryButton: {
    backgroundColor: "#2a2f4a",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
