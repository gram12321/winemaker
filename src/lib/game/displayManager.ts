import { useState, useEffect, useReducer } from 'react';

// Type for subscribers that will receive updates
type DisplaySubscriber = {
  id: string;
  callback: () => void;
};

// Type for component-level hook return
type UseDisplayUpdateResult = {
  forceUpdate: () => void;
  registerForUpdates: () => void;
  unregisterFromUpdates: () => string | null;
};

// Type for display state storage
type DisplayState = {
  [key: string]: any;
};

class DisplayManager {
  private subscribers: DisplaySubscriber[] = [];
  private displayStates: DisplayState = {};
  private static instance: DisplayManager;

  private constructor() {}

  public static getInstance(): DisplayManager {
    if (!DisplayManager.instance) {
      DisplayManager.instance = new DisplayManager();
    }
    return DisplayManager.instance;
  }

  /**
   * Create a new display state for a component
   * @param key Unique identifier for the state
   * @param initialState Initial state object
   */
  public createDisplayState(key: string, initialState: any): void {
    if (this.displayStates[key]) {
      console.warn(`Display state '${key}' already exists. It will be overwritten.`);
    }
    this.displayStates[key] = initialState;
  }

  /**
   * Get the current display state for a component
   * @param key Unique identifier for the state
   * @returns The current state or null if not found
   */
  public getDisplayState(key: string): any {
    return this.displayStates[key] || null;
  }

  /**
   * Update the display state for a component
   * @param key Unique identifier for the state
   * @param updates Partial updates to apply to the state
   */
  public updateDisplayState(key: string, updates: Partial<any>): void {
    if (!this.displayStates[key]) {
      console.warn(`Display state '${key}' does not exist. Creating it now.`);
      this.displayStates[key] = {};
    }
    this.displayStates[key] = { ...this.displayStates[key], ...updates };
    this.updateAllDisplays();
  }

  /**
   * Register a subscriber to receive update notifications
   * @param callback Function to call when updates are needed
   * @returns ID of the registered subscriber
   */
  public register(callback: () => void): string {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    this.subscribers.push({ id, callback });
    return id;
  }

  /**
   * Unregister a subscriber by ID
   * @param id ID of the subscriber to remove
   * @returns true if successfully removed, false if not found
   */
  public unregister(id: string): boolean {
    const initialLength = this.subscribers.length;
    this.subscribers = this.subscribers.filter(sub => sub.id !== id);
    return initialLength !== this.subscribers.length;
  }

  /**
   * Update all subscribers
   * This should be called whenever game state changes
   */
  public updateAllDisplays(): void {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber.callback();
      } catch (error) {
        console.error(`Error updating subscriber ${subscriber.id}:`, error);
      }
    });
  }

  /**
   * Utility to wrap a function with automatic display updates
   * @param fn The function to wrap
   * @returns A new function that calls the original and then updates displays
   */
  public withDisplayUpdate<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: Parameters<T>): ReturnType<T> => {
      const result = fn(...args);
      
      // Handle promise returns
      if (result instanceof Promise) {
        return result.then(res => {
          this.updateAllDisplays();
          return res;
        }) as ReturnType<T>;
      }
      
      // Handle synchronous returns
      this.updateAllDisplays();
      return result;
    }) as T;
  }

  /**
   * Utility to create an action handler that updates displays
   * @param handler The event handler function
   * @returns A wrapped handler that updates displays after execution
   */
  public createActionHandler<T extends (...args: any[]) => any>(handler: T): T {
    return this.withDisplayUpdate(handler);
  }
}

/**
 * React hook for components to use to subscribe to display updates
 * @returns Object with methods to force updates and manage subscription
 */
export const useDisplayUpdate = (): UseDisplayUpdateResult => {
  // Use useReducer instead of useState for forced updates
  // This is a common pattern for forcing component re-renders
  const [, forceRender] = useReducer(s => s + 1, 0);
  
  const [subscriberId, setSubscriberId] = useState<string | null>(null);
  const displayManager = DisplayManager.getInstance();
  
  // Force component to re-render
  const forceUpdate = () => {
    forceRender();
  };
  
  // Register for updates if not already registered
  const registerForUpdates = () => {
    if (!subscriberId) {
      const id = displayManager.register(forceUpdate);
      setSubscriberId(id);
    }
  };
  
  // Clean up subscription when component unmounts
  const unregisterFromUpdates = () => {
    if (subscriberId) {
      displayManager.unregister(subscriberId);
      setSubscriberId(null);
    }
    return subscriberId;
  };
  
  // Automatically register on mount and unregister on unmount
  useEffect(() => {
    registerForUpdates();
    
    return () => {
      unregisterFromUpdates();
    };
  }, []);
  
  return {
    forceUpdate,
    registerForUpdates,
    unregisterFromUpdates
  };
};

// Singleton instance
const displayManager = DisplayManager.getInstance();

export default displayManager; 