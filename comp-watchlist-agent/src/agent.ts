import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import watchListData from "./watchlist.json";

interface WatchListEntry {
  address: string;
  label: string;
}

const watchList: WatchListEntry[] = watchListData;

const watchListMap = new Map(
  watchList.map((entry: WatchListEntry) => [
    entry.address.toLowerCase(),
    entry.label,
  ])
);

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];
  const txnAddresses = Object.keys(txEvent.addresses);
  txnAddresses.forEach((address) => {
    const label = watchListMap.get(address.toLowerCase());
    if (label) {
      findings.push(
        Finding.fromObject({
          name: "Blacklisted Address",
          description: `Blacklisted Address ${address} ('${label}')`,
          alertId: "COMP-BLACKLIST-1",
          severity: FindingSeverity.High,
          type: FindingType.Suspicious,
          metadata: {
            address,
            label,
          },
        })
      );
    }
  });

  return findings;
};

export default {
  handleTransaction,
};
