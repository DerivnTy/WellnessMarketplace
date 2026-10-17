import {ExternalLink} from 'lucide-react';

// Source URLs live in the existing attributes map alongside the facts they support.
export default function AttributeValue({value}:{value:string}) {
  let source:URL|undefined;
  try {
    const url=new URL(value);
    if(url.protocol==='https:') source=url;
  } catch {}
  if(!source) return <>{value}</>;
  return <a className="attribute-source" href={value} target="_blank" rel="noreferrer">View source <ExternalLink size={12}/><span className="sr-only"> at {source.hostname}</span></a>;
}
