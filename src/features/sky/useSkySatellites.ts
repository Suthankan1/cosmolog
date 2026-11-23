import { createAsyncThunk } from '@reduxjs/toolkit';
import { useEffect, useState } from 'react';
import {
  readSatelliteCache, resumeOrbitSource, satelliteRefreshInterval, recordSatelliteFailure, reserveSatelliteRefresh, saveSatelliteOrbit, type SatelliteCacheEntry,
} from '../../database/repositories/satelliteOrbitRepository';
import { fetchJson, HttpError } from '../../services/http';
import type { Connection } from '../../services/network/networkObserver';
import { useAppDispatch } from '../../store';
import { satelliteIds } from './satelliteCatalog';
import { validateSatelliteResponse } from './satelliteElements';

const refreshSkySatellites = createAsyncThunk('sky/refreshSatellites', async (_, { signal }) => {
  for (const noradId of satelliteIds) {
    if (signal.aborted) break;
    if (!await reserveSatelliteRefresh(noradId, Date.now())) continue;
    if (signal.aborted) break;
    const url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=JSON`;
    let response: unknown;
    try {
      response = await fetchJson(url, { signal });
    } catch (error) {
      if (signal.aborted) break;
      await recordSatelliteFailure(noradId, error instanceof HttpError ? 'paused' : 'unavailable');
      // A provider error pauses the entire batch and leaves the last valid elements in place.
      break;
    }
    if (signal.aborted) break;
    const elements = validateSatelliteResponse(response, noradId);
    if (elements) await saveSatelliteOrbit(noradId, elements, Date.now());
    else await recordSatelliteFailure(noradId, 'unavailable');
  }
  return readSatelliteCache();
});

export function useSkySatellites(active: boolean, connection: Connection) {
  const dispatch = useAppDispatch();
  const [attempt, setAttempt] = useState(0);
  useEffect(()=>{
    if(!active || connection!=='online') return;
    const timer=setInterval(()=>setAttempt(n=>n+1),satelliteRefreshInterval);
    return ()=>clearInterval(timer);
  },[active,connection]);
  const [rows, setRows] = useState<SatelliteCacheEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let abort: (() => void) | undefined;
    const load = async () => {
      setStatus('loading');
      const cached = await readSatelliteCache();
      if (stopped) return;
      setRows(cached);
      if (connection === 'online') {
        const refresh = dispatch(refreshSkySatellites());
        abort = refresh.abort;
        const updated = await refresh.unwrap();
        if (stopped) return;
        setRows(updated);
      }
      setStatus('ready');
    };
    void load().catch(() => { if (!stopped) setStatus('unavailable'); });
    return () => {
      stopped = true;
      abort?.();
    };
  }, [active, connection, dispatch, attempt]);

  const resume=()=>{void resumeOrbitSource(Date.now()).then(()=>setAttempt(n=>n+1)).catch(()=>setStatus('unavailable'));};
  return { rows, status, resume };
}
