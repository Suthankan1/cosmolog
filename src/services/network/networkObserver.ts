import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export type Connection = 'online' | 'offline' | 'unknown';

function classifyConnection(state: NetInfoState): Connection {
  if (state.isConnected === false || state.isInternetReachable === false) return 'offline';
  return state.isConnected ? 'online' : 'unknown';
}

export async function getNetworkState(): Promise<Connection> {
  try {
    return classifyConnection(await NetInfo.fetch());
  } catch {
    return 'unknown';
  }
}

export function subscribeToNetworkState(callback: (state: Connection) => void): () => void {
  return NetInfo.addEventListener(state => callback(classifyConnection(state)));
}
