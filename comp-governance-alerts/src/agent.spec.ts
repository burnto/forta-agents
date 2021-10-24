import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
} from "forta-agent";
import {
  COMP_GOVERNANCE_ADDRESS,
  COMP_GOV_PROPOSAL_CREATED_SIG,
  COMP_GOV_VOTE_CAST_SIG,
  COMP_GOV_PROPOSAL_CANCELED_SIG,
  COMP_GOV_PROPOSAL_QUEUED_SIG,
  COMP_GOV_PROPOSAL_EXECUTED_SIG,
} from "./constants";
import agent from "./agent";
import { keccak256 } from "forta-agent/dist/sdk/utils";

const SAMPLE_ADDR = "0x30E7d7FfF85C8d0E775140b1aD93C230D5595207";

describe("governance proposal changes agent", () => {
  let handleTransaction: HandleTransaction;

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("handleTransaction", () => {
    it("returns empty findings if transaction is not a matching contract", async () => {
      const txEvent = createTransactionEvent({
        transaction: {} as any,
        receipt: {
          logs: [],
        } as any,
        block: {} as any,
      });
      const findings = await handleTransaction(txEvent);
      expect(findings).toStrictEqual([]);
    });

    const cases = [
      ["Created", COMP_GOV_PROPOSAL_CREATED_SIG],
      ["Vote Cast", COMP_GOV_VOTE_CAST_SIG],
      ["Canceled", COMP_GOV_PROPOSAL_CANCELED_SIG],
      ["Queued", COMP_GOV_PROPOSAL_QUEUED_SIG],
      ["Executed", COMP_GOV_PROPOSAL_EXECUTED_SIG],
    ];

    test.each(cases)(
      "returns a finding if transaction is governance contract with %s event and has a matching %s sig",
      async (label, signature) => {
        const hashedTopic = keccak256(COMP_GOV_PROPOSAL_CREATED_SIG);
        const txEvent = createTransactionEvent({
          transaction: {
            from: SAMPLE_ADDR,
            to: COMP_GOVERNANCE_ADDRESS,
          } as any,
          receipt: {
            contractAddress: COMP_GOVERNANCE_ADDRESS,
            logs: [
              {
                topics: [hashedTopic],
                address: COMP_GOVERNANCE_ADDRESS,
                data: "",
              },
            ],
          } as any,
          block: {} as any,
        });
        const findings = await handleTransaction(txEvent);
        expect(findings).toStrictEqual([
          Finding.fromObject({
            name: `Compound Governance Proposal Created`,
            description: `Governance Proposal Created from ${SAMPLE_ADDR}`,
            alertId: `COMP-GOV-PROPOSAL-CREATED-1`,
            severity: FindingSeverity.Info,
            type: FindingType.Info,
            metadata: {
              addresses: "",
              from: SAMPLE_ADDR,
            },
          }),
        ]);
      }
    );
  });
});