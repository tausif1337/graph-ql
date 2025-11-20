# Advanced State Management with Apollo & Context

This document provides a comprehensive explanation of advanced state management concepts used in this React Native GraphQL application, including reactive variables, local state management, pagination, error handling, and the combination of Context API with GraphQL.

---

## Table of Contents

1. [Reactive Variables](#1-reactive-variables)
2. [Local State Management](#2-local-state-management)
3. [Pagination & Error Handling](#3-pagination--error-handling)
4. [Combining Context & GraphQL](#4-combining-context--graphql)

---

## 1. Reactive Variables

### What are Reactive Variables?

Reactive variables are Apollo Client's solution for managing local application state that doesn't need to be stored in the GraphQL cache. They provide a reactive way to store and update state that automatically triggers re-renders in components that subscribe to them.

### Key Characteristics

- **Reactive**: Components automatically re-render when the variable value changes
- **Global**: Accessible from anywhere in your application
- **Type-safe**: Can be typed with TypeScript
- **Lightweight**: Not stored in the Apollo cache, perfect for UI state
- **No Query Overhead**: Unlike cache-based state, reactive variables don't require GraphQL queries

### How Reactive Variables Work

Reactive variables use a publish-subscribe pattern:
1. You create a reactive variable using `makeVar()`
2. Components subscribe to changes using `useReactiveVar()` hook
3. When the variable value changes, all subscribed components automatically re-render
4. The variable persists across component unmounts and remounts

### Implementation in This Project

#### Location: `config/apolloClient.ts`

```typescript
import { makeVar } from "@apollo/client";

export const currentPageVar = makeVar<number>(1);
```

**What's happening:**
- `makeVar<number>(1)` creates a reactive variable that stores a number
- Initial value is `1` (first page)
- The variable is exported so it can be used throughout the app
- TypeScript ensures only numbers can be stored

#### Location: `context/AppContext.tsx`

```typescript
import { useReactiveVar } from "@apollo/client/react";
import { currentPageVar } from "../config/apolloClient";

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // useReactiveVar automatically subscribes to changes in currentPageVar
  // and only triggers re-renders when the value actually changes
  const currentPage = useReactiveVar(currentPageVar);

  const setCurrentPage = (page: number) => {
    currentPageVar(page); // Updates the reactive variable
  };

  return (
    <AppContext.Provider value={{ currentPage, setCurrentPage }}>
      {children}
    </AppContext.Provider>
  );
};
```

**What's happening:**
- `useReactiveVar(currentPageVar)` subscribes the component to changes in `currentPageVar`
- When `currentPageVar` changes, this component re-renders
- The `setCurrentPage` function updates the reactive variable by calling `currentPageVar(page)`
- The updated value is then provided to all child components via Context

### Advantages of Reactive Variables

1. **Performance**: Only components using `useReactiveVar()` re-render when the variable changes
2. **Simplicity**: No need to write GraphQL queries or mutations for simple state
3. **Persistence**: State persists even when components unmount
4. **Type Safety**: Full TypeScript support
5. **Separation of Concerns**: UI state separate from server data

### When to Use Reactive Variables

✅ **Use reactive variables for:**
- UI state (modals, themes, filters)
- Pagination state
- Form state
- Temporary application state
- Settings that don't need server sync

❌ **Don't use reactive variables for:**
- Server data (use GraphQL queries)
- Data that needs to be cached
- Complex state that needs normalization

---

## 2. Local State Management

### What is Local State Management?

Local state management refers to managing application state that exists only in the client application, without being synchronized with a server. In this project, we combine multiple state management approaches to create a robust solution.

### State Management Architecture

This project uses a **hybrid approach** combining:
1. **Apollo Reactive Variables** - For global, reactive state
2. **React Context API** - For providing state to components
3. **Apollo Client Cache** - For server data caching

### Implementation Details

#### Architecture Flow

```
┌─────────────────────────────────────────┐
│   Reactive Variable (currentPageVar)    │  ← Source of truth
│   (config/apolloClient.ts)              │
└─────────────────┬───────────────────────┘
                  │
                  │ Subscribed via useReactiveVar
                  ↓
┌─────────────────────────────────────────┐
│   AppContext Provider                   │  ← State provider
│   (context/AppContext.tsx)              │
│   - Reads from reactive variable        │
│   - Provides to components via Context  │
└─────────────────┬───────────────────────┘
                  │
                  │ Accessed via useAppContext
                  ↓
┌─────────────────────────────────────────┐
│   Components (CharacterList)             │  ← State consumers
│   - Uses state for queries              │
│   - Updates state via setCurrentPage    │
└─────────────────────────────────────────┘
```

#### Location: `context/AppContext.tsx`

```typescript
interface AppContextType {
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const currentPage = useReactiveVar(currentPageVar);

  const setCurrentPage = (page: number) => {
    currentPageVar(page);
  };

  return (
    <AppContext.Provider value={{ currentPage, setCurrentPage }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  
  return context;
};
```

**Key Points:**
- **Context Interface**: Defines the shape of state available to components
- **Provider Component**: Wraps the app and provides state to all children
- **Custom Hook**: `useAppContext()` provides type-safe access to context
- **Error Handling**: Throws error if hook is used outside provider

### Why This Hybrid Approach?

#### Benefits of Combining Reactive Variables + Context

1. **Separation of Concerns**
   - Reactive variables handle the actual state storage
   - Context provides a clean API for components
   - Components don't need to know about reactive variables directly

2. **Type Safety**
   - Context interface ensures type safety
   - TypeScript catches errors at compile time

3. **Testability**
   - Easy to mock Context in tests
   - Can test reactive variables independently

4. **Flexibility**
   - Can add more state to Context without changing reactive variables
   - Can add computed values or derived state

5. **Developer Experience**
   - Clean API: `const { currentPage, setCurrentPage } = useAppContext()`
   - No need to import reactive variables in every component
   - Centralized state management

### State Update Flow

When a user clicks "Next" button:

```
1. User clicks "Next" button
   ↓
2. CharacterList calls setCurrentPage(currentPage + 1)
   ↓
3. AppContext.setCurrentPage updates currentPageVar(page)
   ↓
4. Reactive variable notifies all subscribers
   ↓
5. AppContext re-renders with new currentPage value
   ↓
6. CharacterList receives new currentPage from Context
   ↓
7. useQuery automatically refetches with new page variable
   ↓
8. UI updates with new data
```

### Comparison: Reactive Variables vs Other Approaches

| Approach | Pros | Cons | Use Case |
|---------|------|------|----------|
| **Reactive Variables** | Lightweight, reactive, no cache overhead | Not in cache, can't query | UI state, pagination |
| **Apollo Cache** | Queryable, normalized, cached | More overhead, requires queries | Server data |
| **useState** | Simple, built-in | Component-scoped, doesn't persist | Component-specific state |
| **Context + useState** | Global, simple | Re-renders all consumers | Small apps, simple state |

---

## 3. Pagination & Error Handling

### Pagination Implementation

Pagination allows users to navigate through large datasets by breaking them into smaller, manageable pages. This project implements pagination using GraphQL variables and reactive state.

#### Location: `queries/characters.ts`

```typescript
export const GET_CHARACTERS_PAGINATED = gql`
  query GetCharactersPaginated($page: Int!) {
    characters(page: $page) {
      info {
        pages
        next
        prev
      }
      results {
        id
        name
        image
        status
        species
      }
    }
  }
`;
```

**What's happening:**
- `$page: Int!` - GraphQL variable that accepts a page number
- `characters(page: $page)` - Passes the page number to the API
- `info` - Contains pagination metadata (total pages, next/prev page numbers)
- `results` - Array of characters for the current page

#### Location: `components/CharacterList.tsx`

```typescript
const { currentPage, setCurrentPage } = useAppContext();

const { data, loading, error, refetch } = useQuery<CharactersData>(
  GET_CHARACTERS_PAGINATED,
  {
    variables: {
      page: currentPage, // Uses current page from context
    },
    errorPolicy: "all", // Important for error handling
  }
);

const characters = data?.characters?.results || [];
const info = data?.characters?.info;

const maxPages = 2;
const hasNext = info?.next !== null && currentPage < maxPages;
const hasPrev = info?.prev !== null;
```

**Key Points:**
- `variables: { page: currentPage }` - Passes current page to GraphQL query
- Query automatically refetches when `currentPage` changes
- `errorPolicy: "all"` - Allows partial data even if there's an error
- Pagination controls check `hasNext` and `hasPrev` before enabling buttons

#### Pagination Controls

```typescript
<TouchableOpacity
  style={[styles.paginationButton, !hasPrev && styles.paginationButtonDisabled]}
  onPress={() => {
    if (hasPrev && info.prev) {
      setCurrentPage(info.prev); // Updates reactive variable
    }
  }}
  disabled={!hasPrev}
>
  <Text>← Previous</Text>
</TouchableOpacity>

<View style={styles.pageIndicator}>
  <Text>{currentPage} / {maxPages}</Text>
</View>

<TouchableOpacity
  style={[styles.paginationButton, !hasNext && styles.paginationButtonDisabled]}
  onPress={() => {
    if (hasNext && currentPage < maxPages) {
      setCurrentPage(currentPage + 1); // Updates reactive variable
    }
  }}
  disabled={!hasNext}
>
  <Text>Next →</Text>
</TouchableOpacity>
```

**What's happening:**
- Previous button uses `info.prev` from API response
- Next button increments `currentPage`
- Buttons are disabled when at first/last page
- Visual feedback with disabled styles

### Error Handling

Error handling ensures the app gracefully handles network failures, API errors, and edge cases.

#### Error Policy

```typescript
const { data, loading, error, refetch } = useQuery<CharactersData>(
  GET_CHARACTERS_PAGINATED,
  {
    variables: { page: currentPage },
    errorPolicy: "all", // ← Key for error handling
  }
);
```

**Error Policy Options:**
- `"none"` (default) - Query fails completely on error, no data returned
- `"all"` - Returns both data and error, allows partial results
- `"ignore"` - Ignores errors, returns data if available

Using `"all"` allows the app to:
- Show cached/partial data even if there's an error
- Display error message while keeping UI functional
- Provide retry functionality

#### Loading State

```typescript
if (loading && !data) {
  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8b9dc3" />
        <Text style={styles.loadingText}>Loading characters...</Text>
      </View>
    </View>
  );
}
```

**What's happening:**
- Shows loading spinner only on initial load (`loading && !data`)
- Prevents flickering when refetching (if data exists, shows it)
- Provides user feedback during network requests

#### Error State

```typescript
if (error && !data) {
  return (
    <View style={styles.container}>
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
```

**What's happening:**
- Only shows error screen if no data exists (`error && !data`)
- Displays error message from GraphQL
- Provides retry button that calls `refetch()`
- `refetch()` re-executes the query with same variables

#### Error Handling Best Practices

1. **Graceful Degradation**
   ```typescript
   const characters = data?.characters?.results || [];
   ```
   - Uses optional chaining (`?.`) to safely access nested data
   - Provides fallback empty array if data is undefined

2. **Conditional Rendering**
   ```typescript
   {info && (
     <View style={styles.pagination}>
       {/* Pagination controls */}
     </View>
   )}
   ```
   - Only shows pagination if `info` exists
   - Prevents errors from missing data

3. **User-Friendly Messages**
   - Clear error messages
   - Actionable retry button
   - Loading indicators for feedback

### Pagination Patterns

#### 1. Offset-Based Pagination
```typescript
// Not used in this project, but common pattern
query GetItems($offset: Int!, $limit: Int!) {
  items(offset: $offset, limit: $limit) {
    total
    items { ... }
  }
}
```

#### 2. Cursor-Based Pagination
```typescript
// Not used in this project, but common pattern
query GetItems($cursor: String, $first: Int!) {
  items(cursor: $cursor, first: $first) {
    edges { node { ... } }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

#### 3. Page-Based Pagination (Used in This Project)
```typescript
// Current implementation
query GetCharacters($page: Int!) {
  characters(page: $page) {
    info {
      pages
      next
      prev
    }
    results { ... }
  }
}
```

**Why Page-Based?**
- Simple and intuitive
- Easy to implement
- Good for known total pages
- Works well with numbered page indicators

---

## 4. Combining Context & GraphQL

### The Integration Pattern

This project demonstrates how to effectively combine React Context API with Apollo GraphQL to create a powerful state management solution that handles both local UI state and server data.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    App.tsx                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │         ApolloProvider                           │  │
│  │  (Provides GraphQL client to all components)    │  │
│  │                                                   │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │         AppProvider                        │ │  │
│  │  │  (Provides local state via Context)        │ │  │
│  │  │  - Uses reactive variables internally      │ │  │
│  │  │  - Exposes state via Context API           │ │  │
│  │  │                                           │ │  │
│  │  │  ┌─────────────────────────────────────┐ │ │  │
│  │  │  │    CharacterList Component          │ │ │  │
│  │  │  │  - useQuery (GraphQL)               │ │ │  │
│  │  │  │  - useAppContext (Context)          │ │ │  │
│  │  │  │  - Combines both for pagination     │ │ │  │
│  │  │  └─────────────────────────────────────┘ │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Implementation Details

#### Location: `App.tsx`

```typescript
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
```

**Provider Hierarchy:**
1. `SafeAreaProvider` - Handles safe area insets (outermost)
2. `ApolloProvider` - Provides GraphQL client (middle)
3. `AppProvider` - Provides local state via Context (inner)
4. Components - Consume both GraphQL and Context

**Why This Order?**
- `ApolloProvider` must wrap `AppProvider` because Context uses reactive variables from Apollo
- `AppProvider` must wrap components that need local state
- Both providers must wrap components that use GraphQL queries

#### Location: `components/CharacterList.tsx`

```typescript
export default function CharacterList() {
  // 1. Get local state from Context
  const { currentPage, setCurrentPage } = useAppContext();

  // 2. Use GraphQL query with local state
  const { data, loading, error, refetch } = useQuery<CharactersData>(
    GET_CHARACTERS_PAGINATED,
    {
      variables: {
        page: currentPage, // ← Context state used in GraphQL query
      },
      errorPolicy: "all",
    }
  );

  // 3. Update local state, which triggers GraphQL refetch
  const handleNextPage = () => {
    setCurrentPage(currentPage + 1); // ← Updates Context
    // useQuery automatically refetches with new page
  };

  // ... rest of component
}
```

**The Integration Flow:**
1. **Read from Context**: Get `currentPage` from `useAppContext()`
2. **Use in GraphQL**: Pass `currentPage` as query variable
3. **Update Context**: Call `setCurrentPage()` to update state
4. **Automatic Refetch**: `useQuery` detects variable change and refetches

### Benefits of This Pattern

#### 1. Separation of Concerns

- **GraphQL**: Handles server data fetching and caching
- **Context**: Handles local UI state management
- **Reactive Variables**: Provides reactive state storage

#### 2. Automatic Synchronization

```typescript
// When currentPage changes in Context:
setCurrentPage(2)

// useQuery automatically detects the change:
variables: { page: currentPage } // Now page: 2

// And refetches the query:
// GET_CHARACTERS_PAGINATED(page: 2)
```

No manual refetch needed! Apollo Client's reactivity handles it.

#### 3. Type Safety

```typescript
interface AppContextType {
  currentPage: number;        // ← TypeScript ensures type
  setCurrentPage: (page: number) => void;
}

const { currentPage, setCurrentPage } = useAppContext();
// TypeScript knows currentPage is number
// TypeScript knows setCurrentPage accepts number
```

#### 4. Testability

```typescript
// Easy to mock Context in tests
const mockContext = {
  currentPage: 1,
  setCurrentPage: jest.fn(),
};

// Easy to test GraphQL queries independently
const { result } = renderHook(() =>
  useQuery(GET_CHARACTERS_PAGINATED, {
    variables: { page: 1 },
  })
);
```

### Data Flow Diagram

```
┌──────────────┐
│   User       │
│   Action     │
└──────┬───────┘
       │
       │ Clicks "Next"
       ↓
┌─────────────────────┐
│  CharacterList      │
│  setCurrentPage(2)   │
└──────┬──────────────┘
       │
       │ Updates Context
       ↓
┌─────────────────────┐
│  AppContext          │
│  currentPageVar(2)   │
└──────┬──────────────┘
       │
       │ Reactive variable updates
       ↓
┌─────────────────────┐
│  AppContext          │
│  Re-renders with     │
│  currentPage = 2     │
└──────┬──────────────┘
       │
       │ Context value changes
       ↓
┌─────────────────────┐
│  CharacterList       │
│  useQuery detects    │
│  variable change     │
└──────┬──────────────┘
       │
       │ Automatically refetches
       ↓
┌─────────────────────┐
│  Apollo Client      │
│  Executes query     │
│  with page: 2       │
└──────┬──────────────┘
       │
       │ Returns data
       ↓
┌─────────────────────┐
│  CharacterList       │
│  Displays new data   │
└─────────────────────┘
```

### Advanced Patterns

#### Pattern 1: Derived State

```typescript
// In AppContext, you could add computed values
export const AppProvider = ({ children }) => {
  const currentPage = useReactiveVar(currentPageVar);
  
  // Derived state example
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === maxPages;
  
  return (
    <AppContext.Provider value={{
      currentPage,
      setCurrentPage,
      isFirstPage,  // ← Computed from currentPage
      isLastPage,   // ← Computed from currentPage
    }}>
      {children}
    </AppContext.Provider>
  );
};
```

#### Pattern 2: Optimistic Updates

```typescript
// Update local state immediately, then sync with server
const handleNextPage = () => {
  setCurrentPage(currentPage + 1); // Optimistic update
  // GraphQL query will sync with server
};
```

#### Pattern 3: State Persistence

```typescript
// Reactive variables can be persisted
import { makeVar } from "@apollo/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Load from storage on init
const loadPage = async () => {
  const saved = await AsyncStorage.getItem('currentPage');
  return saved ? parseInt(saved) : 1;
};

export const currentPageVar = makeVar<number>(1);

// Save on change
currentPageVar.onNextChange((page) => {
  AsyncStorage.setItem('currentPage', page.toString());
});
```

### Common Pitfalls & Solutions

#### Pitfall 1: Stale Closures

```typescript
// ❌ BAD: Closure captures old value
const handleNext = () => {
  setTimeout(() => {
    setCurrentPage(currentPage + 1); // Uses old currentPage
  }, 1000);
};

// ✅ GOOD: Use functional update
const handleNext = () => {
  setCurrentPage(prev => prev + 1); // Always uses latest value
};
```

#### Pitfall 2: Provider Order

```typescript
// ❌ BAD: AppProvider outside ApolloProvider
<AppProvider>
  <ApolloProvider>
    {/* AppProvider uses reactive variables from Apollo */}
  </ApolloProvider>
</AppProvider>

// ✅ GOOD: Correct order
<ApolloProvider>
  <AppProvider>
    {/* Both providers available */}
  </AppProvider>
</ApolloProvider>
```

#### Pitfall 3: Missing Error Boundaries

```typescript
// ✅ GOOD: Add error boundary
<ErrorBoundary>
  <ApolloProvider>
    <AppProvider>
      <CharacterList />
    </AppProvider>
  </ApolloProvider>
</ErrorBoundary>
```

---

## Summary

This project demonstrates a sophisticated state management architecture that combines:

1. **Reactive Variables** (`config/apolloClient.ts`)
   - Lightweight, reactive state storage
   - Used for pagination state

2. **Context API** (`context/AppContext.tsx`)
   - Provides clean API for components
   - Bridges reactive variables and components

3. **GraphQL Queries** (`queries/characters.ts`, `components/CharacterList.tsx`)
   - Server data fetching
   - Automatic refetching on variable changes

4. **Error Handling** (`components/CharacterList.tsx`)
   - Graceful error states
   - Retry functionality
   - Loading states

5. **Integration** (`App.tsx`)
   - Proper provider hierarchy
   - Seamless data flow

### Key Takeaways

- **Reactive variables** provide efficient local state management
- **Context API** offers a clean interface for components
- **GraphQL** handles server data with automatic caching
- **Combining them** creates a powerful, type-safe state management solution
- **Error handling** ensures robust user experience
- **Pagination** demonstrates real-world state synchronization

This architecture scales well for medium to large applications and provides excellent developer experience with TypeScript support and clear separation of concerns.
