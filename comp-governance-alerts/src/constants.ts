import abi from "./comp-governance-abi.json";

export const COMP_GOVERNANCE_ADDRESS =
  "0xc0da02939e1441f497fd74f78ce7decb17b66529";
export const COMP_GOVERNANCE_ABI = abi;

export const COMP_GOV_PROPOSAL_CREATED_SIG =
  "ProposalCreated(uint id, address proposer, address[] targets, uint[] values, string[] signatures, bytes[] calldatas, uint startBlock, uint endBlock, string description)";
export const COMP_GOV_VOTE_CAST_SIG =
  "VoteCast(address voter, uint proposalId, bool support, uint votes)";
export const COMP_GOV_PROPOSAL_CANCELED_SIG = "ProposalCanceled(uint id)";
export const COMP_GOV_PROPOSAL_QUEUED_SIG = "ProposalQueued(uint id, uint eta)";
export const COMP_GOV_PROPOSAL_EXECUTED_SIG = "ProposalExecuted(uint id)";
