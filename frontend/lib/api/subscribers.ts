type RefreshCallback = (token: string) => void;

const subscribers: Set<RefreshCallback> = new Set();

/**
 * Register a persistent callback to be notified every time a new access token is obtained.
 * Returns an unsubscribe function.
 */
export function addRefreshSubscriber(cb: RefreshCallback) {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

/**
 * Notify all active subscribers of the new access token.
 */
export function notifyRefreshSubscribers(token: string) {
  subscribers.forEach((cb) => {
    try {
      cb(token);
    } catch (err) {
      console.error('Error in refresh subscriber callback:', err);
    }
  });
}
