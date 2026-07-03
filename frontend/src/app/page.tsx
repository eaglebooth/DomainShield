"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  Wallet, 
  PlusCircle, 
  Search, 
  FileCheck, 
  AlertCircle, 
  Sparkles, 
  Clock, 
  ArrowUpRight, 
  Activity, 
  CheckCircle2, 
  Coins,
  RefreshCw,
  Scale
} from "lucide-react";
import { connectWallet, readContract, writeContract } from "@/lib/genlayer";

interface Policy {
  id: number;
  owner: string;
  brandName: string;
  insuredDomain: string;
  premium: string;
  maxCoverage: string;
  startTime: number;
  status: string;
}

interface Claim {
  id: number;
  policyId: number;
  squattedDomain: string;
  evidenceUrl: string;
  status: string;
  decision: string;
  approvedPayout: string;
  squattingScore: string;
  scamRisk: string;
  confidenceScore: string;
  reason: string;
}

export default function Home() {
  // Wallet
  const [wallet, setWallet] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Contract State
  const [contractAddress, setContractAddress] = useState<string>("");
  const [contractOwner, setContractOwner] = useState<string>("");
  const [contractBalance, setContractBalance] = useState<string>("0");
  const [contractReserved, setContractReserved] = useState<string>("0");
  const [contractPaid, setContractPaid] = useState<string>("0");
  const [policyCount, setPolicyCount] = useState<number>(0);
  const [claimCount, setClaimCount] = useState<number>(0);

  // Lists
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);

  // UI Flow Status
  const [statusText, setStatusText] = useState<string>("Disconnected. Connect wallet to read contract.");
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [evaluatingClaimId, setEvaluatingClaimId] = useState<number | null>(null);

  // Forms Drafts
  const [initOwnerWallet, setInitOwnerWallet] = useState<string>("0x0000000000000000000000000000000000000F01");
  const [initBalance, setInitBalance] = useState<string>("2000");

  const [buyBrandName, setBuyBrandName] = useState<string>("DomainShield");
  const [buyInsuredDomain, setBuyInsuredDomain] = useState<string>("domainshield.com");
  const [buyPremium, setBuyPremium] = useState<string>("50");
  const [buyMaxCoverage, setBuyMaxCoverage] = useState<string>("500");

  const [claimPolicyId, setClaimPolicyId] = useState<string>("0");
  const [claimSquattedDomain, setClaimSquattedDomain] = useState<string>("domainshield-scam.net");
  const [claimEvidenceUrl, setClaimEvidenceUrl] = useState<string>("https://example.com/whois/domainshield-scam.net");

  const [addFundAmount, setAddFundAmount] = useState<string>("500");

  // Load contract address on mount
  useEffect(() => {
    const addr = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x58D77993CE38C7b692C21dc5BE5f61fee494C823";
    setContractAddress(addr);
    if (addr) {
      loadContractState();
    }
  }, []);

  function shortAddress(addr: string) {
    if (!addr) return "";
    if (addr.length <= 14) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  async function handleConnectWallet() {
    setIsBusy(true);
    setStatusText("Connecting wallet...");
    const result = await connectWallet();
    setIsBusy(false);
    if (result.success) {
      const address = String(result.data);
      setWallet(address);
      setIsConnected(true);
      setStatusText(`Wallet connected: ${shortAddress(address)}`);
      await loadContractState();
    } else {
      setStatusText(result.error || "Wallet connection failed");
    }
  }

  async function loadContractState() {
    setStatusText("Refreshing contract state...");
    const result = await readContract("get_contract_state");
    if (!result.success) {
      setStatusText(result.error || "Failed to fetch contract state");
      return;
    }

    try {
      const state = JSON.parse(String(result.data));
      setContractBalance(state.balance || "0");
      setContractReserved(state.reserved || "0");
      setContractPaid(state.paid || "0");
      setContractOwner(state.owner || "");
      const pCount = Number(state.policy_count || 0);
      const cCount = Number(state.claim_count || 0);
      setPolicyCount(pCount);
      setClaimCount(cCount);
      setStatusText("Contract state loaded successfully.");
      
      // Load individual policies & claims
      await loadAllPoliciesAndClaims(pCount, cCount);
    } catch (e) {
      setStatusText("Failed to parse contract state: " + String(e));
    }
  }

  async function loadAllPoliciesAndClaims(pCount: number, cCount: number) {
    const loadedPolicies: Policy[] = [];
    for (let i = 0; i < pCount; i++) {
      const res = await readContract("get_policy", [BigInt(i)]);
      if (res.success) {
        try {
          const p = JSON.parse(String(res.data));
          loadedPolicies.push({
            id: i,
            owner: p.owner,
            brandName: p.brand_name,
            insuredDomain: p.insured_domain,
            premium: p.premium,
            maxCoverage: p.max_coverage,
            startTime: p.start_time,
            status: p.status
          });
        } catch {}
      }
    }
    setPolicies(loadedPolicies);

    const loadedClaims: Claim[] = [];
    for (let i = 0; i < cCount; i++) {
      const res = await readContract("get_claim", [BigInt(i)]);
      if (res.success) {
        try {
          const c = JSON.parse(String(res.data));
          loadedClaims.push({
            id: i,
            policyId: Number(c.policy_id),
            squattedDomain: c.squatted_domain,
            evidenceUrl: c.evidence_url,
            status: c.status,
            decision: c.decision,
            approvedPayout: c.approved_payout,
            squattingScore: c.squatting_score,
            scamRisk: c.scam_risk,
            confidenceScore: c.confidence_score,
            reason: c.reason
          });
        } catch {}
      }
    }
    setClaims(loadedClaims);
  }

  async function handleInitializeContract() {
    setIsBusy(true);
    setStatusText("Initializing contract parameters...");
    const result = await writeContract("initialize_contract", [
      initOwnerWallet,
      BigInt(initBalance)
    ]);
    setIsBusy(false);
    if (result.success) {
      setStatusText("Contract initialized successfully!");
      await loadContractState();
    } else {
      setStatusText(result.error || "Initialization failed");
    }
  }

  async function handleAddFunds() {
    setIsBusy(true);
    setStatusText("Depositing funds to contract treasury...");
    const result = await writeContract("add_funds", [BigInt(addFundAmount)]);
    setIsBusy(false);
    if (result.success) {
      setStatusText(`Added ${addFundAmount} tokens to treasury balance.`);
      await loadContractState();
    } else {
      setStatusText(result.error || "Add funds failed");
    }
  }

  async function handleCreatePolicy() {
    setIsBusy(true);
    setStatusText("Registering new domain insurance policy...");
    const timestamp = Math.floor(Date.now() / 1000);
    const result = await writeContract("create_policy", [
      wallet || initOwnerWallet,
      buyBrandName,
      buyInsuredDomain,
      BigInt(buyPremium),
      BigInt(buyMaxCoverage),
      BigInt(timestamp)
    ]);
    setIsBusy(false);
    if (result.success) {
      setStatusText(`Policy created! Policy ID: ${String(result.data)}`);
      await loadContractState();
    } else {
      setStatusText(result.error || "Policy creation failed");
    }
  }

  async function handleFileClaim() {
    setIsBusy(true);
    setStatusText("Filing brand dispute squatting claim...");
    const result = await writeContract("file_claim", [
      BigInt(claimPolicyId),
      claimSquattedDomain,
      claimEvidenceUrl
    ]);
    setIsBusy(false);
    if (result.success) {
      setStatusText(`Dispute claim filed! Claim ID: ${String(result.data)}`);
      await loadContractState();
    } else {
      setStatusText(result.error || "Claim filing failed");
    }
  }

  async function handleEvaluateClaim(claimId: number) {
    setEvaluatingClaimId(claimId);
    setStatusText(`Jury is evaluating claim #${claimId} (scraping evidence & calling LLM consensus)...`);
    const result = await writeContract("evaluate_claim", [BigInt(claimId)]);
    setEvaluatingClaimId(null);
    if (result.success) {
      setStatusText(`Claim #${claimId} evaluated! Consensus complete.`);
      await loadContractState();
    } else {
      setStatusText(result.error || `Evaluation of claim #${claimId} failed`);
    }
  }

  async function handlePayoutClaim(claimId: number) {
    setIsBusy(true);
    setStatusText(`Releasing approved insurance payout for claim #${claimId}...`);
    const result = await writeContract("payout_claim", [BigInt(claimId)]);
    setIsBusy(false);
    if (result.success) {
      setStatusText(`Payout completed! Status updated to PAID.`);
      await loadContractState();
    } else {
      setStatusText(result.error || `Payout of claim #${claimId} failed`);
    }
  }

  // Pre-fill helpers for scenarios
  function fillScenarioSquatter() {
    setBuyBrandName("NexusTech");
    setBuyInsuredDomain("nexustech.com");
    setClaimSquattedDomain("nexustech-shop.net");
    setClaimEvidenceUrl("https://example.com/whois/nexustech-shop.net");
    setStatusText("Loaded Squatter Extortion scenario details.");
  }

  function fillScenarioLegit() {
    setBuyBrandName("AppleSoft");
    setBuyInsuredDomain("applesoft.io");
    setClaimSquattedDomain("apple.com");
    setClaimEvidenceUrl("https://example.com/whois/apple.com");
    setStatusText("Loaded Legit Pre-existing Site scenario details.");
  }

  return (
    <div className="container">
      {/* Header */}
      <header>
        <div className="brand">
          <div className="brand-icon">
            <Shield size={22} color="white" />
          </div>
          <div>
            <h1 className="brand-name">DomainShield</h1>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>
              Brand Domain Squatting Insurance
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {contractAddress ? (
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Contract: <code style={{ color: "var(--secondary)" }}>{shortAddress(contractAddress)}</code>
            </span>
          ) : (
            <span style={{ fontSize: "0.85rem", color: "var(--danger)" }}>No contract address env</span>
          )}
          <button className="wallet-btn" onClick={handleConnectWallet} disabled={isBusy}>
            <Wallet size={16} />
            {isConnected ? shortAddress(wallet) : "Connect Wallet"}
          </button>
        </div>
      </header>

      {/* Main Status Text Bar */}
      <div 
        style={{
          background: "rgba(10, 5, 20, 0.7)",
          border: "1px solid var(--border-color)",
          borderRadius: "0.75rem",
          padding: "1rem 1.5rem",
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          fontSize: "0.9rem"
        }}
      >
        <Activity size={18} color="var(--primary-bright)" className="pulse" />
        <span style={{ color: "var(--text-muted)" }}>System Logs:</span>
        <span style={{ color: "var(--text-main)", fontWeight: 500 }}>{statusText}</span>
      </div>

      {/* Metrics Banner */}
      <div className="metrics-banner">
        <div className="metric-card">
          <span className="metric-label">Treasury Balance</span>
          <span className="metric-value glow-violet">{contractBalance} Gwei</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Disputed Reserved</span>
          <span className="metric-value">{contractReserved} Gwei</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Paid Claims</span>
          <span className="metric-value">{contractPaid} Gwei</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Active Policies</span>
          <span className="metric-value">{policyCount}</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Disputes Filed</span>
          <span className="metric-value">{claimCount}</span>
        </div>
      </div>

      {/* Forms Row: Buy Insurance & File Dispute side-by-side (Full Width) */}
      <div className="forms-row" style={{ marginBottom: "2rem" }}>
        {/* Create Insurance Policy */}
        <div className="card-module">
          <h2 className="card-title">
            <PlusCircle size={20} />
            Buy Domain Insurance
          </h2>
          <div className="form-group">
            <label className="form-label">Brand Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={buyBrandName} 
              onChange={(e) => setBuyBrandName(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Insured Brand Domain</label>
            <input 
              type="text" 
              className="form-input" 
              value={buyInsuredDomain} 
              onChange={(e) => setBuyInsuredDomain(e.target.value)} 
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Premium (Gwei)</label>
              <input 
                type="number" 
                className="form-input" 
                value={buyPremium} 
                onChange={(e) => setBuyPremium(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Max Coverage (Gwei)</label>
              <input 
                type="number" 
                className="form-input" 
                value={buyMaxCoverage} 
                onChange={(e) => setBuyMaxCoverage(e.target.value)} 
              />
            </div>
          </div>
          <button 
            className="submit-btn" 
            onClick={handleCreatePolicy} 
            disabled={isBusy || !isConnected}
          >
            {!isConnected ? "Connect Wallet to Purchase" : "Purchase Policy"}
          </button>
        </div>

        {/* File Dispute Claim */}
        <div className="card-module">
          <h2 className="card-title">
            <Search size={20} />
            File Squatting Dispute
          </h2>
          <div className="form-group">
            <label className="form-label">Policy ID</label>
            <input 
              type="number" 
              className="form-input" 
              value={claimPolicyId} 
              onChange={(e) => setClaimPolicyId(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Squatted Target Domain</label>
            <input 
              type="text" 
              className="form-input" 
              value={claimSquattedDomain} 
              onChange={(e) => setClaimSquattedDomain(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">WHOIS / Content Evidence URL</label>
            <input 
              type="text" 
              className="form-input" 
              value={claimEvidenceUrl} 
              onChange={(e) => setClaimEvidenceUrl(e.target.value)} 
            />
          </div>
          <button 
            className="submit-btn" 
            onClick={handleFileClaim} 
            disabled={isBusy || !isConnected}
          >
            {!isConnected ? "Connect Wallet to Dispute" : "File Dispute Claim"}
          </button>
        </div>
      </div>

      {/* Row 1: Initialize/Refill (Left) & Disputes Registry (Right) */}
      <div className="dashboard-grid" style={{ marginBottom: "2rem" }}>
        {contractOwner === "" ? (
          <div className="card-module">
            <h2 className="card-title">
              <Coins size={20} />
              Initialize Contract
            </h2>
            <div className="form-group">
              <label className="form-label">Owner Wallet</label>
              <input 
                type="text" 
                className="form-input" 
                value={initOwnerWallet} 
                onChange={(e) => setInitOwnerWallet(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Initial Balance (Gwei)</label>
              <input 
                type="number" 
                className="form-input" 
                value={initBalance} 
                onChange={(e) => setInitBalance(e.target.value)} 
              />
            </div>
            <button 
              className="submit-btn" 
              onClick={handleInitializeContract} 
              disabled={isBusy}
            >
              Setup Treasury Fund
            </button>
          </div>
        ) : (
          <div className="card-module">
            <h2 className="card-title">
              <Coins size={20} />
              Refill Treasury Fund
            </h2>
            <div style={{ display: "flex", gap: "1rem", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Deposit additional tokens to cover insurance payouts.
              </p>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Amount (Gwei)</label>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={addFundAmount} 
                    onChange={(e) => setAddFundAmount(e.target.value)} 
                  />
                  <button 
                    className="submit-btn" 
                    onClick={handleAddFunds} 
                    disabled={isBusy}
                    style={{ width: "160px" }}
                  >
                    Deposit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filed Dispute Claims */}
        <div className="card-module">
          <h2 className="card-title">
            <Scale size={20} />
            Disputes & Claims Registry ({claims.length})
          </h2>

          <div className="list-container">
            {claims.length === 0 ? (
              <div className="no-data">No squatting dispute claims filed.</div>
            ) : (
              claims.map((c) => {
                const isEvaluating = evaluatingClaimId === c.id;
                
                return (
                  <div key={c.id} className={`claim-card status-${c.status}`}>
                    <div className="claim-header">
                      <div>
                        <div className="claim-domain-title">
                          {c.squattedDomain}
                          <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "normal", marginLeft: "0.5rem" }}>
                            (Claim #{c.id})
                          </span>
                        </div>
                        <div className="claim-meta">
                          <span>Policy ID: <strong>{c.policyId}</strong></span>
                          <span>Evidence: <a href={c.evidenceUrl} target="_blank" rel="noopener noreferrer" className="claim-url">{shortAddress(c.evidenceUrl)}</a></span>
                        </div>
                      </div>
                      <div>
                        <span className={`badge badge-${c.status}`}>{c.status}</span>
                      </div>
                    </div>

                    {/* Display AI Report Scores if evaluated */}
                    {(c.status !== "FILED") && (
                      <div className="ai-eval-box">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--primary-bright)", marginBottom: "0.5rem" }}>
                          <Sparkles size={14} />
                          <span>GenLayer AI Jury Consensus Report</span>
                        </div>
                        <div className="eval-metrics">
                          <div className="eval-metric-item">
                            <span className="eval-metric-num">{c.squattingScore}%</span>
                            <span className="eval-metric-lbl">Squatting</span>
                          </div>
                          <div className="eval-metric-item">
                            <span className="eval-metric-num">{c.scamRisk}%</span>
                            <span className="eval-metric-lbl">Scam Risk</span>
                          </div>
                          <div className="eval-metric-item">
                            <span className="eval-metric-num">{c.confidenceScore}%</span>
                            <span className="eval-metric-lbl">Confidence</span>
                          </div>
                        </div>
                        <div className="eval-reason">
                          &ldquo;{c.reason || "No detail explanation provided."}&rdquo;
                        </div>
                        <div style={{ fontSize: "0.85rem", marginTop: "0.5rem", color: "var(--secondary)" }}>
                          Approved Payout: <strong>{c.approvedPayout} Gwei</strong>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="claim-actions">
                      {(c.status === "FILED" || c.status === "NEEDS_REVIEW") && (
                        <button 
                          className="action-btn"
                          disabled={isEvaluating || isBusy}
                          onClick={() => handleEvaluateClaim(c.id)}
                        >
                          {isEvaluating ? (
                            <span className="loading-indicator">
                              <span className="spinner" /> Evaluating...
                            </span>
                          ) : (
                            <>
                              <Scale size={14} /> Run AI Jury Consensus
                            </>
                          )}
                        </button>
                      )}
                      {c.status === "APPROVED" && (
                        <button 
                          className="action-btn action-btn-success"
                          disabled={isBusy}
                          onClick={() => handlePayoutClaim(c.id)}
                        >
                          <ArrowUpRight size={14} /> Disburse Coverage Payout ({c.approvedPayout} Gwei)
                        </button>
                      )}
                      {c.status === "PAID" && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--success)", fontSize: "0.85rem", fontWeight: "bold" }}>
                          <CheckCircle2 size={16} /> Fully Reclaimed & Reimbursed
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Testing Scenarios (Left) & Insurance Policies (Right) */}
      <div className="dashboard-grid" style={{ marginBottom: "2rem" }}>
        {/* Left Column: Scenarios */}
        <div className="card-module">
          <h2 className="card-title">
            <Sparkles size={20} />
            Testing Scenarios
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Pre-fill input fields with demo data representing two different insurance claim scenarios:
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
            <button 
              className="action-btn" 
              onClick={fillScenarioSquatter}
              style={{ textAlign: "left", justifyContent: "flex-start", padding: "0.75rem" }}
            >
              <div>
                <strong>🔴 Scenario 1: Malicious Squatting</strong>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Target domain registered recently, parked with buy-back extortion.
                </div>
              </div>
            </button>
            <button 
              className="action-btn" 
              onClick={fillScenarioLegit}
              style={{ textAlign: "left", justifyContent: "flex-start", padding: "0.75rem" }}
            >
              <div>
                <strong>🟢 Scenario 2: Pre-existing Site</strong>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Legitimate established domain name registered years ago.
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Right Column: Policies */}
        <div className="card-module">
          <h2 className="card-title" style={{ justifyContent: "space-between" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileCheck size={20} />
              Insurance Policies ({policies.length})
            </span>
            <button 
              onClick={loadContractState} 
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            >
              <RefreshCw size={16} />
            </button>
          </h2>
          
          <div className="list-container">
            {policies.length === 0 ? (
              <div className="no-data">No active insurance policies registered on-chain yet.</div>
            ) : (
              policies.map((p) => (
                <div key={p.id} className="policy-card">
                  <div className="policy-info">
                    <div className="policy-brand">
                      Brand: {p.brandName}
                      <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: "normal", marginLeft: "0.5rem" }}>
                        (ID: {p.id})
                      </span>
                    </div>
                    <div className="policy-domains">
                      Insured Domain: <strong>{p.insuredDomain}</strong>
                    </div>
                    <div className="policy-financials">
                      Coverage: <strong>{p.maxCoverage} Gwei</strong> &bull; Premium: <strong>{p.premium} Gwei</strong>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Owner: {shortAddress(p.owner)}
                    </div>
                  </div>
                  <div>
                    <span className="badge badge-APPROVED">ACTIVE</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
