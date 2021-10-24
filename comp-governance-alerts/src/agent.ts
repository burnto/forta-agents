import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  Log,
} from "forta-agent";
import { BigNumber, Contract, ethers, utils } from "ethers";
import {
  COMP_GOVERNANCE_ADDRESS,
  COMP_GOVERNANCE_ABI,
  COMP_GOV_PROPOSAL_CREATED_SIG,
  COMP_GOV_VOTE_CAST_SIG,
  COMP_GOV_PROPOSAL_CANCELED_SIG,
  COMP_GOV_PROPOSAL_QUEUED_SIG,
  COMP_GOV_PROPOSAL_EXECUTED_SIG,
} from "./constants";

const governanceSignatures = new Map([
  [COMP_GOV_PROPOSAL_CREATED_SIG, "Created"],
  [COMP_GOV_VOTE_CAST_SIG, "Vote Cast"],
  [COMP_GOV_PROPOSAL_CANCELED_SIG, "Canceled"],
  [COMP_GOV_PROPOSAL_QUEUED_SIG, "Queued"],
  [COMP_GOV_PROPOSAL_EXECUTED_SIG, "Executed"],
]);

function findingFromLog(
  signature: string,
  label: string,
  txEvent: TransactionEvent,
  log: Log
) {
  return Finding.fromObject({
    name: `Compound Governance Proposal ${label}`,
    description: `Governance Proposal ${label} from ${txEvent.from}`,
    alertId: `COMP-GOV-PROPOSAL-${label.toUpperCase()}-1`,
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      addresses: Object.keys(txEvent.addresses).join(", "),
      from: txEvent.from,
    },
  });
}

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  governanceSignatures.forEach((label, sig) => {
    const logs = txEvent.filterEvent(sig, COMP_GOVERNANCE_ADDRESS);
    logs.forEach((log) => {
      findings.push(findingFromLog(sig, label, txEvent, log));
    });
  });
  return findings;
};

export default {
  handleTransaction,
};
