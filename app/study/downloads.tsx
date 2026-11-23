import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, ScrollView, Text, View } from 'react-native';
import { useIsFocused } from 'expo-router';
import { Header } from '../../src/components/common/Header';
import { Button } from '../../src/components/common/Button';
import { useAppDispatch, useAppSelector } from '../../src/store';
import { studyStyles as s } from '../../src/features/study/layout';
import { edition, studyEntries } from '../../src/features/study/edition';
import { downloadPack, readManifest, refreshManifest, shipsWithApp } from '../../src/features/study/packDownloads';
import { installedPacks, packSize, removePack, type CatalogPack } from '../../src/features/study/packRepository';

export default function Downloads() {
  const dispatch=useAppDispatch();
  const online=useAppSelector(state=>state.feed.connection==='online');
  const focused=useIsFocused();
  const [foreground,setForeground]=useState(AppState.currentState==='active');
  const [packs,setPacks]=useState<CatalogPack[]>([]);
  const [installed,setInstalled]=useState<Awaited<ReturnType<typeof installedPacks>>>([]);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState('');
  const [progress,setProgress]=useState(0);
  const running=useRef<{abort:()=>void}|null>(null);
  const reload=useCallback(async ()=>{
    const [manifest,local]=await Promise.all([readManifest(),installedPacks()]);
    setPacks(manifest.packs);setInstalled(local);
  },[]);
  useEffect(()=>{
    const sub=AppState.addEventListener('change',v=>setForeground(v==='active'));
    return ()=>{sub.remove();running.current?.abort();};
  },[]);
  useEffect(()=>{
    if(!focused || !foreground)return;
    let active=true;
    void Promise.all([readManifest(),installedPacks()]).then(async ([localManifest,localPacks])=>{
      if(!active)return;
      setPacks(localManifest.packs);setInstalled(localPacks);
      if(!online || !active)return;
      const result=await dispatch(refreshManifest());
      if(!active)return;
      if(refreshManifest.fulfilled.match(result))setPacks(result.payload.packs);
      else setMessage('Update catalog unavailable. Installed and bundled editions are accessible.');
    }).catch(()=>{if(active)setMessage('Could not read the pack catalog.');});
    return ()=>{active=false;};
  },[online,dispatch,reload,focused,foreground]);
  async function install(pack:CatalogPack) {
    if(running.current)return;
    setBusy(pack.id);setProgress(0);setMessage('');
    const task=dispatch(downloadPack({pack,onProgress:setProgress}));running.current=task;
    try {await task.unwrap();await reload();setMessage('Pack installed. Search its entries in the atlas.');}
    catch {setMessage('Installation interrupted. Retry to resume verified parts.');}
    finally {running.current=null;setBusy('');}
  }
  async function remove(pack:CatalogPack) {
    setBusy(pack.id);
    try {await removePack(pack.id);await reload();setMessage('Pack removed. Bookmarked entries are retained.');}
    catch {setMessage('Could not remove this pack.');}
    finally {setBusy('');}
  }
  return <View style={s.page}><Header title="Editions and downloads" showBack/><ScrollView contentContainerStyle={s.content}>
    <Text style={s.heading}>Installed coverage</Text>
    <Text style={s.body}>{edition}</Text>
    <Text style={s.note}>8 chapters · {studyEntries.filter(e=>!e.chapter).length} object profiles · offline</Text>
    <Text style={s.body}>City index · November 2026</Text>
    <Text style={s.note}>52,004 places · major cities worldwide and Sri Lankan populated places · GeoNames CC BY 4.0</Text>
    <Text style={s.body}>Sky catalog</Text>
    <Text style={s.note}>80 named stars, 6 Messier objects, the Moon, 7 planets and 4 spacecraft. Spacecraft positions require recent orbital elements.</Text>
    <Text style={s.section}>Optional packs</Text>
    {packs.map(pack=>{
      const local=installed.find(i=>i.id===pack.id);
      return <View key={pack.id} style={{gap:8}}><Text style={s.body}>{pack.title}</Text>
        <Text style={s.note}>{packSize(pack).toLocaleString()} bytes · edition {pack.revision}{local?' · installed edition '+local.revision:''}</Text>
        {(!local || local.revision<pack.revision) && <Button title={busy===pack.id?'Installing '+progress+' / '+pack.parts.length:
          shipsWithApp(pack)?'Install bundled supplement':'Download edition'} disabled={!!busy || (!online && !shipsWithApp(pack))} onPress={()=>void install(pack)}/>}
        {local && <Button title="Remove pack" variant="outline" disabled={!!busy} onPress={()=>void remove(pack)}/>}
        {busy===pack.id && (!local || local.revision<pack.revision) && <Button title="Pause download" variant="outline" onPress={()=>running.current?.abort()}/>}
      </View>;
    })}
    {!!message && <Text accessibilityLiveRegion="polite" style={s.note}>{message}</Text>}
  </ScrollView></View>;
}
