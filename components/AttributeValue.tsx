import {ExternalLink} from 'lucide-react';

// Source URLs live in the existing attributes map alongside the facts they support.
export default function AttributeValue({value}:{value:string}) {
  try {
    const url=new URL(value);
    if(url.protocol==='https:') return <a className="attribute-source" href={value} target="_blank" rel="noreferrer">View source <ExternalLink size={12}/><span className="sr-only"> at {url.hostname}</span></a>;
  } catch {}
  return <>{value}</>;
}
