import { createHash as mockHash } from 'node:crypto';
import { downloadPack } from '../src/features/study/packDownloads';
import { activatePack } from '../src/features/study/packRepository';
import manifest from '../study-releases/manifest.json';
import ground from '../study-releases/observatories/1/ground.json';
import space from '../study-releases/observatories/1/space.json';

const mockFiles = new Map<string,Buffer>();
let mockFreeSpace=100_000_000;
const mockFetch=jest.fn();
jest.mock('expo/fetch',()=>({fetch:(...args:unknown[])=>mockFetch(...args)}));
jest.mock('expo-file-system',()=>({
  Paths:{document:'document',get availableDiskSpace(){return mockFreeSpace;}},
  Directory:class {
    path:string;
    constructor(...segments:string[]){this.path=segments.join('/');}
    create(){}
    get exists(){return true;}
    delete(){for(const key of mockFiles.keys()) if(key.startsWith(this.path+'/'))mockFiles.delete(key);}
  },
  File:class {
    key:string;
    constructor(dir:{path:string},name:string){this.key=dir.path+'/'+name;}
    get exists(){return mockFiles.has(this.key);}
    get size(){return mockFiles.get(this.key)?.length;}
    async digest(){return mockHash('sha256').update(mockFiles.get(this.key)!).digest('hex');}
    create(){mockFiles.set(this.key,Buffer.alloc(0));}
    async write(data:string|Uint8Array){await new Promise(resolve=>setTimeout(resolve,5));mockFiles.set(this.key,Buffer.from(data));}
    async text(){return mockFiles.get(this.key)!.toString();}
  },
}));
jest.mock('../src/features/study/packRepository',()=>({
  ...jest.requireActual('../src/features/study/packRepository'),
  activatePack:jest.fn(async()=>undefined),
}));
const pack={...manifest.packs[0],revision:2};
function response(data:string){
  let done=false;
  return {ok:true,body:{getReader:()=>({read:async()=>{
    if(done)return {done:true};
    done=true;return {done:false,value:Buffer.from(data)};
  },cancel:async()=>undefined})}};
}
const install=()=>downloadPack({pack,onProgress:()=>undefined})(jest.fn(),()=>({}),undefined);
beforeEach(()=>{mockFiles.clear();jest.clearAllMocks();mockFreeSpace=100_000_000;});
it('resumes verified parts after connectivity fails',async()=>{
  mockFetch.mockResolvedValueOnce(response(JSON.stringify(ground)+'\n')).mockRejectedValueOnce(Error('offline'));
  expect(downloadPack.rejected.match(await install())).toBe(true);
  expect(activatePack).not.toHaveBeenCalled();
  mockFetch.mockResolvedValueOnce(response(JSON.stringify(space)+'\n'));
  expect(downloadPack.fulfilled.match(await install())).toBe(true);
  expect(mockFetch).toHaveBeenCalledTimes(3);
  expect(activatePack).toHaveBeenCalledWith(pack,[...ground,...space]);
  expect(mockFiles.size).toBe(0);
});
it('rejects insufficient storage and corrupt bytes before activation',async()=>{
  mockFreeSpace=100;
  expect(downloadPack.rejected.match(await install())).toBe(true);
  expect(mockFetch).not.toHaveBeenCalled();
  mockFreeSpace=100_000_000;
  mockFetch.mockResolvedValueOnce(response('x'.repeat(pack.parts[0].bytes)));
  expect(downloadPack.rejected.match(await install())).toBe(true);
  expect(activatePack).not.toHaveBeenCalled();
});
