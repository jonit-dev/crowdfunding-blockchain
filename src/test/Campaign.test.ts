import assert from "assert";
import { Contract } from "web3-eth-contract";
import { localNetworkHelper } from "../libs/LocalNetworkHelper";

let campaignFactory: Contract;
let campaign: Contract;

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

  const deployedCampaigns = await campaignFactory.methods
    .getDeployedCampaigns()
    .call();
  const campaignContractAddress = deployedCampaigns[0];

  const { abi: campaignABI } = compiledContracts.get("Campaign")!;

  campaign = await localNetworkHelper.getContractFromAddress(
    campaignABI,
    campaignContractAddress
  );
});

describe("Campaign.sol", () => {
  it("gets a valid CampaignFactory contract", () => {
    // having an address confirms that the contract was deployed successfully
    assert.ok(campaignFactory.options.address);
  });

  it("gets a valid Campaign contract", () => {
    assert.ok(campaign.options.address);
  });
});
