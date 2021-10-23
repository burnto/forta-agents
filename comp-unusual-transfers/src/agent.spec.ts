import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
} from "forta-agent";
import { keccak256 } from "forta-agent/dist/sdk/utils";
import { BigNumber, utils } from "ethers";
import {
  COMPTROLLER_ADDR,
  COMP_DISTRIBUTED_BORROWER_EVENT,
  COMP_DISTRIBUTED_SUPPLIER_EVENT,
  COMP_TOKEN_ADDRESS,
  ERC20_TRANSFER_EVENT,
  UNUSUAL_TXN_SIZE,
} from "./constants";
import agent from "./agent";

const SAMPLE_ADDR = "0x30E7d7FfF85C8d0E775140b1aD93C230D5595207";

describe("unusual distribution agent", () => {
  let handleTransaction: HandleTransaction;

  const createDistributionTxn = (
    contractAddr: string,
    addr: string,
    sig: string
  ) => {
    const topic = keccak256(sig);
    const erc20Topic = keccak256(ERC20_TRANSFER_EVENT);

    return createTransactionEvent({
      transaction: {
        from: addr,
        to: contractAddr,
      } as any,
      receipt: {
        contractAddress: COMPTROLLER_ADDR,
        logs: [
          {
            topics: [topic],
            address: COMPTROLLER_ADDR,
          },
          {
            topics: [erc20Topic],
            address: COMP_TOKEN_ADDRESS,
            data: BigNumber.from(UNUSUAL_TXN_SIZE + 1),
          },
        ],
      } as any,
      block: {} as any,
      addresses: { [addr]: true },
    });
  };

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("handleTransaction", () => {
    it("returns empty findings if transaction is not a matching contract", async () => {
      const txEvent = createDistributionTxn(
        SAMPLE_ADDR,
        SAMPLE_ADDR,
        COMP_DISTRIBUTED_BORROWER_EVENT
      );

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if transaction is not a matching sig", async () => {
      const txEvent = createDistributionTxn(
        COMPTROLLER_ADDR,
        SAMPLE_ADDR,
        "SomeOtherSig(address,address,uint256,uint256)"
      );

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns a finding if transaction is a legit distibution of a large amount", async () => {
      const txEvent = createDistributionTxn(
        COMPTROLLER_ADDR,
        SAMPLE_ADDR,
        COMP_DISTRIBUTED_SUPPLIER_EVENT
      );

      const findings = await handleTransaction(txEvent);
      const expectedAmt = UNUSUAL_TXN_SIZE + 1;
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Unusual Comptroller Distribution",
          description: `Unusual Comptroller Distribution of ${expectedAmt} COMP for address ${txEvent.from}`,
          alertId: "COMP-UNUSUAL-TRANSFER-1",
          severity: FindingSeverity.High,
          type: FindingType.Suspicious,
          metadata: {
            distribution: `${expectedAmt}`,
            address: txEvent.from,
          },
        }),
      ]);
    });
  });
});
