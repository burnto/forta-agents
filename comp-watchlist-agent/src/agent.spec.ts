import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
} from "forta-agent";
import agent from "./agent";

describe("blacklisted wallet agent", () => {
  let handleTransaction: HandleTransaction;

  const createTxEventWithAddress = (addr: string) =>
    createTransactionEvent({
      transaction: {} as any,
      receipt: {} as any,
      block: {} as any,
      addresses: { [addr]: true },
    });

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("handleTransaction", () => {
    it("returns empty findings if transaction is not from a blacklisted agent", async () => {
      const txEvent = createTxEventWithAddress("0x00");

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns a finding if transaction is from a blacklisted agent", async () => {
      const addr = "0x30E7d7FfF85C8d0E775140b1aD93C230D5595207";

      const txEvent = createTxEventWithAddress(addr);

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Blacklisted Address",
          description: `Blacklisted Address ${addr} ('evil address')`,
          alertId: "COMP-BLACKLIST-1",
          severity: FindingSeverity.High,
          type: FindingType.Suspicious,
          metadata: {
            address: addr,
            label: "evil address",
          },
        }),
      ]);
    });
  });
});
