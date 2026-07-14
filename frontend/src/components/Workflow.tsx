"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { writeContract } from "@/lib/genlayer";
import { useWallet } from "./WalletProvider";

export type WorkflowMode = "fund" | "withdraw" | "policy" | "close" | "claim" | "review" | "appeal" | "payout";

const config: Record<WorkflowMode, [string, string]> = {
  fund: ["fund_reserve", "Deposit GEN"],
  withdraw: ["withdraw_unallocated", "Withdraw GEN"],
  policy: ["create_policy", "Create policy"],
  close: ["close_policy", "Close policy"],
  claim: ["file_claim", "File claim"],
  review: ["evaluate_claim", "Run AI review"],
  appeal: ["submit_appeal", "Submit appeal"],
  payout: ["payout_claim", "Release payout"],
};

function parseGen(input: string): bigint {
  const value = input.trim();
  if (!/^\d+(\.\d{0,18})?$/.test(value)) throw new Error("Enter a valid GEN amount with up to 18 decimals.");
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(10) ** BigInt(18) + BigInt((fraction + "0".repeat(18)).slice(0, 18));
}

export function Workflow({ mode, id }: { mode: WorkflowMode; id?: string }) {
  const contract = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
  const { address, connect } = useWallet();
  const [values, setValues] = useState({ amount:"", brand:"", domain:"", premium:"", standard:"", coverage:"", policy:"", squatted:"", evidence:"", claim:id||"", appeal:"" });
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const update = (key: keyof typeof values, value: string) => setValues((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!address) { await connect(); return; }
    if (!contract) { setFailed(true); setMessage("DomainShield V3 needs a new Studio deployment before contract actions can run."); return; }
    try {
      let args: unknown[] = [];
      let value = BigInt(0);
      if (mode === "fund") value = parseGen(values.amount);
      if (mode === "withdraw") args = [parseGen(values.amount)];
      if (mode === "policy") { args = [values.brand, values.domain, parseGen(values.standard), parseGen(values.coverage)]; value = parseGen(values.premium); }
      if (mode === "close") args = [BigInt(values.policy || 0)];
      if (mode === "claim") args = [BigInt(values.policy || 0), values.squatted, values.evidence];
      if (mode === "review" || mode === "payout") args = [BigInt(values.claim || 0)];
      if (mode === "appeal") args = [BigInt(values.claim || 0), values.appeal];
      setFailed(false);
      setMessage("Confirm in wallet, then wait for GenLayer finalization...");
      const result = await writeContract(config[mode][0], args, contract, value);
      setFailed(!result.success);
      setMessage(result.success ? `Finalized: ${String(result.data ?? result.status ?? result.hash)}` : result.error || "Contract call failed");
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Invalid form input");
    }
  }

  return <form className="packet" onSubmit={submit}><div className="packet-head"><strong className="mono">DOMAIN ACTION / {config[mode][0]}</strong><span>V3</span></div><div className="packet-body">
    {(mode === "fund" || mode === "withdraw") && <Field label="GEN amount"><input className="input" inputMode="decimal" placeholder="0.10" value={values.amount} onChange={(e)=>update("amount",e.target.value)} required/></Field>}
    {mode === "policy" && <><div className="grid2"><Field label="Brand name"><input className="input" value={values.brand} onChange={(e)=>update("brand",e.target.value)} required/></Field><Field label="Insured domain"><input className="input mono" value={values.domain} onChange={(e)=>update("domain",e.target.value)} placeholder="brand.com" required/></Field></div><div className="grid2"><Field label="Premium deposit (GEN)"><input className="input" inputMode="decimal" value={values.premium} onChange={(e)=>update("premium",e.target.value)} required/></Field><Field label="Standard payout (GEN)"><input className="input" inputMode="decimal" value={values.standard} onChange={(e)=>update("standard",e.target.value)} required/></Field></div><Field label="Full payout / maximum coverage (GEN)"><input className="input" inputMode="decimal" value={values.coverage} onChange={(e)=>update("coverage",e.target.value)} required/></Field></>}
    {mode === "close" && <Field label="Policy ID"><input className="input" type="number" min="0" value={values.policy} onChange={(e)=>update("policy",e.target.value)} required/></Field>}
    {mode === "claim" && <><Field label="Policy ID"><input className="input" type="number" min="0" value={values.policy} onChange={(e)=>update("policy",e.target.value)} required/></Field><Field label="Suspected squatted domain"><input className="input mono" value={values.squatted} onChange={(e)=>update("squatted",e.target.value)} required/></Field><Field label="Public WHOIS / web evidence URL"><input className="input" type="url" value={values.evidence} onChange={(e)=>update("evidence",e.target.value)} required/></Field></>}
    {(mode === "review" || mode === "payout") && <Field label="Claim ID"><input className="input" type="number" min="0" value={values.claim} onChange={(e)=>update("claim",e.target.value)} required/></Field>}
    {mode === "appeal" && <><Field label="Claim ID"><input className="input" type="number" min="0" value={values.claim} onChange={(e)=>update("claim",e.target.value)} required/></Field><Field label="New appeal evidence URL"><input className="input" type="url" value={values.appeal} onChange={(e)=>update("appeal",e.target.value)} required/></Field></>}
    {message && <div className={`notice ${failed ? "bad" : "ok"}`}>{message}</div>}
    <button className={mode === "payout" || mode === "withdraw" || mode === "close" ? "btn-risk" : "btn"}>{address ? config[mode][1] : "Connect wallet first"}<ArrowRight size={16}/></button>
  </div></form>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="field"><label>{label}</label>{children}</div>; }
