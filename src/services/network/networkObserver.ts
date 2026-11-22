import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export type NetworkChangeCallback = (isConnected: boolean) => void;

/**
 * Checks current network connectivity.
 */
export async function getNetworkState(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return Boolean(state.isConnected && state.isInternetReachable !== false);
  } catch {
    return true; // Default to online if detector is unavailable
  }
}

/**
 * Listens for network transitions and executes callback.
 */
export function subscribeToNetworkState(callback: NetworkChangeCallback): () => void {
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
    callback(isOnline);
  });
  return unsubscribe;
}
