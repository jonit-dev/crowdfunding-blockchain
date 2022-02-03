import ganache from "ganache-cli";
import Web3 from "web3";
import { Contract } from "web3-eth-contract";
import { Evm } from "../@types/solidity/smartContractTypes";
import { ContractHelper } from "./ContractHelper";

interface IContractDeployOptions {
  contractName: string;
  contractArgs: any[];
}

class LocalNetworkHelper {
  public testingAccounts: Promise<string[]>;
  private contractHelper: ContractHelper;
  private web3: Web3 = new Web3(ganache.provider());

  constructor() {
    this.contractHelper = new ContractHelper();
    this.testingAccounts = this.web3.eth.getAccounts();
  }

  public async compileAndDeploy(
    contractToCompile: string,
    contractsToDeploy: IContractDeployOptions[],
    args: any[] = []
  ): Promise<Contract[]> {
    // get all result entries
    const compiledContracts = this.contractHelper.compile(contractToCompile);

    const deployedContracts: Contract[] = [];

    for (const contractToDeploy of contractsToDeploy) {
      console.log(
        `🚢 Deploying contract ${contractToDeploy.contractName} to Local Network...`
      );

      const { abi, evm } = compiledContracts.get(
        contractToDeploy.contractName
      )!;

      if (!abi || !evm) {
        throw new Error(
          `Contract ${contractToDeploy.contractName} with missing abi or evm. Please double check.`
        );
      }

      const contract = await this.deploy(abi, evm, args);

      deployedContracts.push(contract);
    }

    return deployedContracts;
  }

  public async getTestingAccount(): Promise<string> {
    const accounts = await this.testingAccounts;
    return accounts[0];
  }

  private async deploy(
    abi: any,
    evm: Evm,
    args: any[] = [],
    gas: number = 2000000
  ): Promise<Contract> {
    return new this.web3.eth.Contract(abi)
      .deploy({ data: evm.bytecode.object, arguments: args })
      .send({
        from: await this.getTestingAccount(),
        gas,
      }) as unknown as Contract;
  }
}

const localNetworkHelper = new LocalNetworkHelper();

export { localNetworkHelper };
