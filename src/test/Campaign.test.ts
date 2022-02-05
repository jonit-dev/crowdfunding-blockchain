import assert from "assert";
import { Contract } from "web3-eth-contract";
import { localNetworkHelper } from "../libs/LocalNetworkHelper";

let campaignFactory: Contract;

before(async () => {
  // deploy the contract
  const { compiledContracts, deployedContracts } =
    await localNetworkHelper.compileAndDeploy("Campaign", [
      {
        contractName: "CampaignFactory",
        contractArgs: ["0"],
      },
    ]);
  campaignFactory = deployedContracts.get("CampaignFactory")!;

  await campaignFactory.methods.createCampaign("100").send({
    from: await localNetworkHelper.getTestingAccount(),
    gas: "1000000",
  });
});

describe("Campaign.sol", () => {
  it("deploys a contract", () => {
    // having an address confirms that the contract was deployed successfully
    assert.ok(campaignFactory.options.address);
  });
});
