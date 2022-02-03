import assert from "assert";
import { Contract } from "web3-eth-contract";
import { localNetworkHelper } from "../libs/LocalNetworkHelper";

let inbox: Contract;

beforeEach(async () => {
  // deploy the contract
  inbox = await localNetworkHelper.compileAndDeploy("Campaign");
});

describe("Campaign.sol", () => {
  it("deploys a contract", () => {
    // having an address confirms that the contract was deployed successfully
    assert.ok(inbox.options.address);
  });
});
