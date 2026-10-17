import type {TrustProfile} from './trust';
// Only untouched initial research can be refreshed automatically. Never overwrite an editor.
export function researchUpdateState(current:{data:string;status:string}|undefined,baseline:TrustProfile|undefined,next:TrustProfile){
 if(!current)return 'insert';
 if(current.status!==next.status)return 'skip';
 if(current.data===JSON.stringify(next))return 'record';
 if(baseline&&baseline.reviewer==='AI-assisted desk research'&&current.data===JSON.stringify(baseline))return 'update';
 return 'skip';
}
