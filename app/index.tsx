import { Redirect } from 'expo-router';
import { useAppSelector } from '../src/store';

export default function EntryRoute() {
  const authenticated = useAppSelector(state => state.auth.isAuthenticated);
  return <Redirect href={authenticated ? '/(tabs)/discover' : '/(auth)/login'} />;
}
