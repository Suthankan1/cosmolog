import { CityPicker } from './CityPicker';
import { useState } from 'react';
import { Keyboard, Linking, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { colors, spacing, typography } from '../../theme/tokens';
import { parseCoordinates } from './skyMath';
import { previewLocation, type useSkyLocation } from './useSkyLocation';

type Props = ReturnType<typeof useSkyLocation>;

export function SkyLocationControls({ location, status, useLocation, chooseLocation }: Props) {
  const [editing, setEditing] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [invalid, setInvalid] = useState(false);

  function choose(location: Parameters<Props['chooseLocation']>[0]) {
    setInvalid(false);
    setEditing(false);
    Keyboard.dismiss();
    chooseLocation(location);
  }

  const save = () => {
    const coordinates = parseCoordinates(latitude, longitude);
    if (coordinates) choose({ ...coordinates, kind: 'manual' });
    else setInvalid(true);
  };

  if (editing) return (
    <View style={styles.form}>
      <CityPicker onSelect={city=>choose({kind:'manual',latitude:city.latitude,longitude:city.longitude,elevation:0,
        city:{name:[city.name,city.region,city.country].filter(Boolean).join(', '),zone:city.zone}})}/>
      <Input label="Latitude" value={latitude} onChangeText={setLatitude} placeholder="6.9271" keyboardType="numbers-and-punctuation" maxLength={18} />
      <Input label="Longitude" value={longitude} onChangeText={setLongitude} placeholder="79.8612" keyboardType="numbers-and-punctuation" maxLength={18} />
      {invalid && <Text accessibilityRole="alert" style={styles.error}>Enter latitude from −90 to 90 and longitude from −180 to 180.</Text>}
      <Button title="Use coordinates" onPress={save} />
      <Button title="Preview Colombo" variant="outline" onPress={() => choose(previewLocation)} />
      <Button title="Cancel" variant="outline" onPress={() => { Keyboard.dismiss(); setEditing(false); setInvalid(false); }} />
    </View>
  );

  const finding = location.kind !== 'manual' && (status === 'locating' || status === 'checking');
  const canUseLocation = status !== 'unsupported' && (location.kind !== 'device' || status === 'unavailable');
  return (
    <View style={styles.form}>
      {finding && <Text accessibilityLiveRegion="polite" style={styles.note}>
        {status === 'locating' ? 'Finding device location…' : 'Checking location access…'}
      </Text>}
      {location.kind !== 'manual' && status === 'unavailable' && (
        <Text style={styles.note}>A fresh device location is unavailable. You can enter coordinates or try again.</Text>
      )}
      {location.kind !== 'manual' && status === 'choose' && (
        <Text style={styles.note}>Use your phone’s location to see the sky overhead and enable phone pointing.</Text>
      )}
      {status === 'blocked' && (
        <Text style={styles.note}>To use device location, allow location access in your device settings.</Text>
      )}
      {canUseLocation && !finding && (
        status === 'blocked' ? (
          <Button title="Open location settings" icon="settings" variant="outline" onPress={() => { void Linking.openSettings().catch(() => undefined); }} />
        ) : <Button title="Use my location" icon="navigation" onPress={useLocation} />
      )}
      <Button title="Change location" icon="map-pin" variant="outline" onPress={() => setEditing(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing[2] },
  note: { ...typography.bodySmall, color: colors.muted },
  error: { ...typography.body, color: colors.danger },
});
