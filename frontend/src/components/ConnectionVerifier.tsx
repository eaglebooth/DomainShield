"use client";

import { ExternalLink, RefreshCw } from "lucide-react";
import { useState } from "react";
import { readContract } from "@/lib/genlayer";

const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

export function ConnectionVerifier() {
  const [state, setState] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState("Ready to read get_contract_state from Studionet.");
  const [loading, setLoading] = useState(false);

  async function verify() {
    setLoading(true);
    setMessage("Reading live contract state...");
    const result = await readContract("get_contract_state", [], address);
    setLoading(false);
    if (!result.success) {
      setState(null);
      setMessage(result.error || "Contract read failed.");
      return;
    }
    try {
      const parsed = typeof result.data === "string" ? JSON.parse(result.data) : result.data;
      setState(parsed as Record<string, unknown>);
      setMessage("Live state received from DomainShield V2.");
    } catch {
      setState({ response: result.data });
      setMessage("Contract responded with a non-JSON value.");
    }
  }

  return <section className="band"><div className="wrap workflow"><aside className="guide"><strong>Deployment</strong><p className="meta">Network</p><p className="mono">GenLayer Studionet</p><p className="meta">Contract</p><p className="mono" style={{overflowWrap:"anywhere"}}>{address || "Not configured"}</p></aside><div className="packet"><div className="packet-head"><strong>LIVE CONTRACT PROOF</strong><span>{state ? "CONNECTED" : "READY"}</span></div><div className="packet-body"><p>{message}</p>{state ? <div className="list">{Object.entries(state).map(([key,value])=><div className="row" key={key}><strong className="mono">{key}</strong><span style={{gridColumn:"span 3",overflowWrap:"anywhere"}}>{String(value)}</span><span/></div>)}</div> : <div className="empty">No static contract state is displayed. Verify to request it from the deployed Intelligent Contract.</div>}<div style={{display:"flex",gap:12,flexWrap:"wrap"}}><button className="btn" onClick={verify} disabled={loading || !address}><RefreshCw size={16}/>{loading ? "VERIFYING..." : "SYNC CONTRACT"}</button><a className="btn-alt" href={`https://studio.genlayer.com/contracts/${address}`} target="_blank" rel="noreferrer">OPEN STUDIO <ExternalLink size={15}/></a></div></div></div></div></section>;
}
