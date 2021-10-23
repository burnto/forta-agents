import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import { BigNumber, utils } from "ethers";
import {
  COMPTROLLER_ADDR,
  COMP_DISTRIBUTED_SUPPLIER_EVENT,
  COMP_DISTRIBUTED_BORROWER_EVENT,
  ERC20_TRANSFER_EVENT,
  COMP_TOKEN_ADDRESS,
  UNUSUAL_TXN_SIZE,
} from "./constants";

interface WatchListEntry {
  address: string;
  label: string;
}

const UNUSUAL_TXN_SIZE_BN = BigNumber.from(UNUSUAL_TXN_SIZE);

function isComptrollerDistribution(txEvent: TransactionEvent): boolean {
  if (txEvent.to !== COMPTROLLER_ADDR) {
    return false;
  }

  if (
    txEvent.filterEvent(COMP_DISTRIBUTED_SUPPLIER_EVENT, COMPTROLLER_ADDR)
      .length > 0
  ) {
    return true;
  }

  if (
    txEvent.filterEvent(COMP_DISTRIBUTED_BORROWER_EVENT, COMPTROLLER_ADDR)
      .length > 0
  ) {
    return true;
  }

  return false;
}

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  if (!isComptrollerDistribution(txEvent)) {
    return findings;
  }

  const compTransferLogs = txEvent.filterEvent(
    ERC20_TRANSFER_EVENT,
    COMP_TOKEN_ADDRESS
  );
  if (!compTransferLogs.length) {
    return findings;
  }
  const [transferCompEvent] = compTransferLogs;
  const compDistributed = BigNumber.from(transferCompEvent.data);
  if (compDistributed.lt(UNUSUAL_TXN_SIZE_BN)) {
    return findings;
  }

  const formatDistributed = compDistributed.toString();
  findings.push(
    Finding.fromObject({
      name: "Unusual Comptroller Distribution",
      description: `Unusual Comptroller Distribution of ${formatDistributed} COMP for address ${txEvent.from}`,
      alertId: "COMP-UNUSUAL-TRANSFER-1",
      severity: FindingSeverity.High,
      type: FindingType.Suspicious,
      metadata: {
        distribution: compDistributed.toString(),
        address: txEvent.from,
      },
    })
  );

  return findings;
};

export default {
  handleTransaction,
};
