import ganache from "ganache-cli";
import Web3 from "web3";
import { Contract } from "web3-eth-contract";
import {
  Evm,
  ICompileOptions,
  IContractData,
  IContractDeployOptions,
} from "../@types/solidity/smartContractTypes";
import { ContractHelper } from "./ContractHelper";

interface ICompileAndDeployOutput {
  compiledContracts: Map<string, IContractData>;
  deployedContracts: Map<string, Contract>;
}

class LocalNetworkHelper {
  public testingAccounts: Promise<string[]>;
  private contractHelper: ContractHelper;
  public web3: Web3 = new Web3(ganache.provider());

  constructor() {
    this.contractHelper = new ContractHelper();
    this.testingAccounts = this.web3.eth.getAccounts();
  }

  public async compileAndDeploy(
    contractToCompile: string,
    contractsToDeploy: IContractDeployOptions[],
    args: any[] = [],
    compileOptions: ICompileOptions = {
      forceRecompile: false,
    }
  ): Promise<ICompileAndDeployOutput> {
    // get all result entries
    const compiledContracts = this.contractHelper.compile(
      contractToCompile,
      compileOptions
    );

    const deployedContractsOutput = new Map<string, Contract>();

    for (const contractToDeploy of contractsToDeploy) {
      const { abi, evm } = compiledContracts.get(
        contractToDeploy.contractName
      )!;

      if (!abi || !evm) {
        throw new Error(
          `Contract ${contractToDeploy.contractName} with missing abi or evm. Please double check.`
        );
      }

      const contract = await this.deploy(abi, evm, args);

      deployedContractsOutput.set(contractToDeploy.contractName, contract);
    }

    return {
      deployedContracts: deployedContractsOutput,
      compiledContracts: compiledContracts,
    };
  }

  public async getTestingAccount(): Promise<string> {
    const accounts = await this.testingAccounts;
    return accounts[0];
  }

  public async getContractFromAddress(
    contractABI: any,
    contractAddress: string
  ): Promise<Contract> {
    return new this.web3.eth.Contract(
      contractABI,
      contractAddress
    ) as unknown as Contract;
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
