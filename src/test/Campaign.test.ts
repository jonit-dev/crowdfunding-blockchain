import assert from "assert";
import { Contract } from "web3-eth-contract";
import { localNetworkHelper } from "../libs/LocalNetworkHelper";

let campaignFactory: Contract;

before(async () => {
  // deploy the contract
  const results = await localNetworkHelper.compileAndDeploy("Campaign", [
    {
      contractName: "CampaignFactory",
      contractArgs: ["0"],
    },
  ]);
  campaignFactory = results.get("CampaignFactory")!;
});

describe("Campaign.sol", () => {
  it("deploys a contract", () => {
    // having an address confirms that the contract was deployed successfully
    assert.ok(campaignFactory.options.address);
  });
});
