"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { readContract } from "@/lib/genlayer";

export default function ClaimPage(){
  const{id}=useParams<{id:string}>();
  const contract=process.env.NEXT_PUBLIC_CONTRACT_ADDRESS||"";
  const[data,setData]=useState<Record<string,string|number>|null>(null);
  const[message,setMessage]=useState(contract?"Sync this claim from DomainShield V3.":"V3 contract address is not configured.");
  async function sync(){if(!contract)return;const result=await readContract("get_claim",[Number(id)],contract);if(result.success&&typeof result.data==="string"){try{setData(JSON.parse(result.data));setMessage("Claim refreshed from Studionet.")}catch{setMessage("Malformed contract response.")}}else setMessage(result.error||"Read failed")}
  const actions=[["Review",`/claims/${id}/review`],["Appeal",`/claims/${id}/appeal`],["Appeal review",`/claims/${id}/appeal/review`],["Payout",`/claims/${id}/payout`]];
  return <><section className="page-head"><div className="wrap"><span className="kicker">Claim / {id}</span><h1 className="display">DOMAIN RISK FILE #{id}</h1><p className="lede">{message}</p><button className="btn-alt" onClick={sync} disabled={!contract}>SYNC CLAIM</button></div></section><section className="band"><div className="wrap workflow"><aside className="guide"><strong>Actions</strong><ol>{actions.map(([label,href])=><li key={href}><Link href={href}>{label}</Link></li>)}</ol></aside><div className="packet"><div className="packet-head"><strong>ON-CHAIN CLAIM</strong><span>{data?.status||"NOT LOADED"}</span></div><div className="packet-body">{data?Object.entries(data).map(([key,value])=><div className="row" key={key}><strong className="mono">{key}</strong><span style={{gridColumn:"span 3",overflowWrap:"anywhere"}}>{value}</span><span/></div>):<div className="empty">No fake claim is shown before a successful read.</div>}</div></div></div></section></>;
}
