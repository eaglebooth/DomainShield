"use client";
import Link from "next/link";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { useState } from "react";
import { readContract } from "@/lib/genlayer";

export function OnchainList({kind}:{kind:"policies"|"claims"}){
  const contract=process.env.NEXT_PUBLIC_CONTRACT_ADDRESS||"";
  const[rows,setRows]=useState<Record<string,string|number>[]>([]);
  const[message,setMessage]=useState(contract?"Sync DomainShield V3 to load records.":"V3 contract address is not configured.");
  async function sync(){
    if(!contract)return;
    const count=await readContract(kind==="policies"?"get_policy_count":"get_claim_count",[],contract);
    if(!count.success){setMessage(count.error||"Read failed");return}
    const total=Number(count.data||0);
    const fn=kind==="policies"?"get_policy":"get_claim";
    const results=await Promise.all(Array.from({length:total},(_,index)=>readContract(fn,[index],contract)));
    setRows(results.flatMap(result=>{try{return result.success&&typeof result.data==="string"?[JSON.parse(result.data)]:[]}catch{return[]}}));
    setMessage(total?`Synced ${total} ${kind}.`:`No ${kind} recorded on V3 yet.`);
  }
  return <div className="wrap"><div className="contract-in" style={{paddingBottom:16,borderBottom:"2px solid var(--ink)"}}><span className="meta">{message}</span><button className="btn-alt" onClick={sync} disabled={!contract}><RefreshCw size={15}/>SYNC</button></div>{rows.length===0?<div className="empty"><h2 className="display" style={{fontSize:32}}>NO PLACEHOLDER RECORDS.</h2><p>Only data returned by the deployed contract appears here.</p></div>:<div className="list">{rows.map((row,index)=>kind==="policies"?<div className="row" key={index}><b>#{index}</b><div><strong>{row.brand_name}</strong><div className="meta mono">{row.insured_domain}</div></div><span>{row.status}</span><span>{row.remaining_coverage}</span><span/></div>:<Link className="row" href={`/claims/${index}`} key={index}><b>#{index}</b><div><strong>{row.squatted_domain}</strong><div className="meta">Policy #{row.policy_id}</div></div><span>{row.status}</span><span>{row.squatting_score}/100</span><ArrowUpRight size={16}/></Link>)}</div>}</div>;
}
