import { TestNetwork } from "../@types/networkTypes";
import { TestNetworkHelper } from "../libs/TestNetworkHelper";

(async () => {
  const testNetworkHelper = new TestNetworkHelper(TestNetwork.Rinkeby);

  const deployedContracts = await testNetworkHelper.compileAndDeploy(
    "Campaign",
    [
      {
        contractName: "CampaignFactory",
      },
    ]
  );

  const campaignFactory = deployedContracts.get("CampaignFactory")!;

  const testingAccounts = await testNetworkHelper.getTestingAccounts();

  await campaignFactory.methods.createCampaign("100").send({
    from: testingAccounts[0],
    gas: "1000000",
  });

  const deployedCampaigns = await campaignFactory.methods
    .getDeployedCampaigns()
    .call();

  console.log("getDeployedCampaigns()", deployedCampaigns);
})();
