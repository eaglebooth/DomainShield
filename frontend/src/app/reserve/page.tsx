import Link from "next/link";
import { WorkflowPage } from "@/components/WorkflowPage";

export default function ReservePage(){return <><WorkflowPage mode="fund" kicker="Reserve / fund_reserve" title="EXPAND REAL COVERAGE CAPACITY." copy="Only the deployer can deposit native GEN into the insurance reserve." steps={["Connect the deployer wallet.","Enter the native GEN amount.","Verify available and reserved balances after finalization."]}/><section className="band"><div className="wrap"><Link className="btn-alt" href="/reserve/withdraw">WITHDRAW UNALLOCATED GEN</Link></div></section></>}
