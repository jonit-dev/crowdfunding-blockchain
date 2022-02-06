import assert from "assert";
import web3 from "web3";
import { Contract } from "web3-eth-contract";
import { localNetworkHelper } from "../libs/LocalNetworkHelper";

let campaignFactory: Contract;
let campaign: Contract;
let testingAccounts: string[];

beforeEach(async () => {
  testingAccounts = await localNetworkHelper.testingAccounts;

  // deploy the contract
  // first argument "Campaign" refers to Campaign.sol, which has 2 different contracts inside: Campaign and CampaignFactory.
  // We use the CampaignFactory to save gas costs (the user will be in charge of paying the gas for deploying every new Campaign contract)
  const { compiledContracts, deployedContracts } =
    await localNetworkHelper.compileAndDeploy("Campaign", [
      {
        contractName: "CampaignFactory",
      },
    ]);
  campaignFactory = deployedContracts.get("CampaignFactory")!;

  // creates a campaign sending a minimum contribution amount of 100 wei
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

  it("campaign manager is the testing account", async () => {
    const manager = await campaign.methods.manager().call();
    assert.ok(manager === (await localNetworkHelper.getTestingAccount()));
  });

  it("allows people to contribute money and marks them as approvers", async () => {
    const testingAccounts = await localNetworkHelper.testingAccounts;

    await campaign.methods.contribute().send({
      from: testingAccounts[1],
      value: "200",
    });

    const isContributor = await campaign.methods
      .approvers(testingAccounts[1])
      .call();

    assert(isContributor);
  });

  it("requires a minimum contribution to a campaign", async () => {
    const minimumContribution = await campaign.methods
      .minimumContribution()
      .call();

    assert.ok(minimumContribution);

    // it must reject the contribution, if we try to submit less than the minimum contribution amount (which is 100 wei, check above)
    await assert.rejects(
      campaign.methods.contribute().send({
        from: await localNetworkHelper.getTestingAccount(),
        value: "0",
      })
    );
  });

  it("allows a manager to make a payment request", async () => {
    const managerAddress = await campaign.methods.manager().call();

    await campaign.methods
      .createRequest("Money for alcohol", "100", managerAddress)
      .send({
        from: managerAddress,
        gas: "1000000",
      });

    const request = await campaign.methods.requests(0).call();

    assert.ok(request.description === "Money for alcohol");
  });

  it("should increase smart contract balance after a contribution is given", async () => {
    await campaign.methods.contribute().send({
      from: await localNetworkHelper.getTestingAccount(),
      value: web3.utils.toWei("5", "ether"),
    });

    const balance = await campaign.methods.getTotalContributionsWei().call();

    assert.ok(balance === web3.utils.toWei("5", "ether"));
  });

  it("processes requests", async () => {
    const testingAccount = await localNetworkHelper.getTestingAccount();

    await campaign.methods.contribute().send({
      from: testingAccount,
      value: web3.utils.toWei("10", "ether"),
    });

    // register initial account 1 balance
    const initialRecipientBalance = await parseBalanceToETH(testingAccounts[1]);

    await campaign.methods
      .createRequest(
        "A new request",
        web3.utils.toWei("5", "ether"),
        testingAccounts[1]
      )
      .send({
        from: testingAccount,
        gas: "1000000",
      });

    await campaign.methods.approveRequest(0).send({
      from: testingAccount,
      gas: "1000000",
    });

    await campaign.methods.finalizeRequest(0).send({
      from: testingAccount,
      gas: "1000000",
    });

    const finalRecipientBalance = await parseBalanceToETH(testingAccounts[1]);
    // if our final balance is higher than our initial, then the request was processed successfully
    assert.ok(finalRecipientBalance > initialRecipientBalance);
  });
});

const parseBalanceToETH = async (account: string): Promise<number> => {
  let balance = await localNetworkHelper.web3.eth.getBalance(account);
  balance = web3.utils.fromWei(balance, "ether");
  return parseFloat(balance);
};
