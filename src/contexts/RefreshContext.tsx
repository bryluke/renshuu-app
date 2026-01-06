'use client';

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';

// All valid refresh event names - add new events here as features grow
type RefreshEvent = 'today' | 'meals' | 'weight' | 'goals' | 'profile';

type RefreshCallback = () => void | Promise<void>;

interface RefreshContextType {
  subscribe: (event: RefreshEvent, callback: RefreshCallback) => void;
  unsubscribe: (event: RefreshEvent, callback: RefreshCallback) => void;
  emit: (event: RefreshEvent) => Promise<void>;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const RefreshProvider = ({ children }: { children: ReactNode }) => {
  // Using ref to avoid re-renders when subscriptions change
  // Map<event, Set<callbacks>> allows multiple subscribers per event
  const subscribersRef = useRef<Map<RefreshEvent, Set<RefreshCallback>>>(
    new Map()
  );

  const subscribe = useCallback(
    (event: RefreshEvent, callback: RefreshCallback) => {
      const subscribers = subscribersRef.current;

      if (!subscribers.has(event)) {
        subscribers.set(event, new Set());
      }

      subscribers.get(event)!.add(callback);
    },
    []
  );

  const unsubscribe = useCallback(
    (event: RefreshEvent, callback: RefreshCallback) => {
      const subscribers = subscribersRef.current;
      const eventSubscribers = subscribers.get(event);

      if (eventSubscribers) {
        eventSubscribers.delete(callback);

        if (eventSubscribers.size === 0) {
          subscribers.delete(event);
        }
      }
    },
    []
  );

  const emit = useCallback(async (event: RefreshEvent) => {
    const subscribers = subscribersRef.current;
    const eventSubscribers = subscribers.get(event);

    if (eventSubscribers) {
      // Execute all callbacks, handling both sync and async
      const promises = Array.from(eventSubscribers).map((callback) =>
        Promise.resolve(callback())
      );
      await Promise.all(promises);
    }
  }, []);

  return (
    <RefreshContext.Provider value={{ subscribe, unsubscribe, emit }}>
      {children}
    </RefreshContext.Provider>
  );
};

// Hook for pages - subscribes on mount, unsubscribes on unmount
export const useRefreshSubscription = (
  event: RefreshEvent,
  callback: RefreshCallback
) => {
  const context = useContext(RefreshContext);

  if (context === undefined) {
    throw new Error(
      'useRefreshSubscription must be used within a RefreshProvider'
    );
  }

  const { subscribe, unsubscribe } = context;

  // Stable callback ref to avoid re-subscribing on every render
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const stableCallback = () => callbackRef.current();

    subscribe(event, stableCallback);
    return () => unsubscribe(event, stableCallback);
  }, [event, subscribe, unsubscribe]);
};

// Hook for drawers - returns emit function
export const useRefresh = () => {
  const context = useContext(RefreshContext);

  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }

  return { emit: context.emit };
};

// Export type for use elsewhere if needed
export type { RefreshEvent };
