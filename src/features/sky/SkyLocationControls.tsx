import { useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { colors, spacing, typography } from '../../theme/tokens';
import { colombo, parseCoordinates, type ObserverLocation } from './skyMath';

export type SkyLocation = ObserverLocation & { kind: 'preview' | 'manual' };
export const previewLocation: SkyLocation = { ...colombo, kind: 'preview' };

export function SkyLocationControls({ onChange }: { onChange: (location: SkyLocation) => void }) {
  const [editing, setEditing] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [invalid, setInvalid] = useState(false);

  function choose(location: SkyLocation) {
    setInvalid(false);
    setEditing(false);
    Keyboard.dismiss();
    onChange(location);
  }

  const save = () => {
    const coordinates = parseCoordinates(latitude, longitude);
    if (coordinates) choose({ ...coordinates, kind: 'manual' });
    else setInvalid(true);
  };

  return editing ? (
    <View style={styles.form}>
      <Input label="Latitude" value={latitude} onChangeText={setLatitude} placeholder="6.9271" keyboardType="numbers-and-punctuation" maxLength={18} />
      <Input label="Longitude" value={longitude} onChangeText={setLongitude} placeholder="79.8612" keyboardType="numbers-and-punctuation" maxLength={18} />
      {invalid && <Text accessibilityRole="alert" style={styles.error}>Enter latitude from −90 to 90 and longitude from −180 to 180.</Text>}
      <Button title="Use coordinates" onPress={save} />
      <Button title="Preview Colombo" variant="outline" onPress={() => choose(previewLocation)} />
      <Button title="Cancel" variant="outline" onPress={() => { Keyboard.dismiss(); setEditing(false); setInvalid(false); }} />
    </View>
  ) : <Button title="Change location" icon="map-pin" variant="outline" onPress={() => setEditing(true)} />;
}

const styles = StyleSheet.create({
  form: { gap: spacing[2] },
  error: { ...typography.body, color: colors.danger },
});
