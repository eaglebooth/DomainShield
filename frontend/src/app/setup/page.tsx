import { ContractBar } from "@/components/ContractBar";
import { ConnectionVerifier } from "@/components/ConnectionVerifier";
import { PageHead } from "@/components/PageHead";

export default function SetupPage(){return <><PageHead kicker="Deployment identity" title="VERIFY THE DEPLOYER-OWNED RESERVE." copy="DomainShield V3 assigns the reserve owner in its constructor. There is no first-caller setup transaction."/><ContractBar/><section className="band"><div className="wrap"><ConnectionVerifier/></div></section></>}
