import { StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ApolloProvider } from "@apollo/client/react";
import { client } from "./config/apolloClient";
import { AppProvider } from "./context/AppContext";
import CharacterList from "./components/CharacterList";

export default function App() {
  return (
    <SafeAreaProvider>
      <ApolloProvider client={client}>
        <AppProvider>
          <SafeAreaView style={styles.container}>
            <CharacterList />
          </SafeAreaView>
        </AppProvider>
      </ApolloProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0e27",
  },
});