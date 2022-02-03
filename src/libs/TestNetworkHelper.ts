import HDWalletProvider from "@truffle/hdwallet-provider";
import Web3 from "web3";
import { Contract } from "web3-eth-contract";
import { TestNetwork } from "../@types/networkTypes";
import {
  Evm,
  ICompileOptions,
  IContractDeployOptions,
} from "../@types/solidity/smartContractTypes";
import { appEnv } from "../constants/envConstants";
import { testNetworkEndpoints } from "../constants/networkConstants";
import { ContractHelper } from "./ContractHelper";

export class TestNetworkHelper {
  private web3: Web3;
  private provider: HDWalletProvider;
  private endpoint: string;
  private contractHelper: ContractHelper;

  constructor(testNetwork: TestNetwork) {
    this.endpoint = testNetworkEndpoints[testNetwork]!;
    console.log(appEnv.metamask.mnemonic);
    console.log(this.endpoint);
    this.provider = new HDWalletProvider(
      appEnv.metamask.mnemonic!,
      this.endpoint
    );
    this.web3 = new Web3(this.provider);
    this.contractHelper = new ContractHelper();
  }

  private async getAccounts() {
    return this.web3.eth.getAccounts();
  }

  public async compileAndDeploy(
    contractToCompile: string,
    contractsToDeploy: IContractDeployOptions[],
    args: any[] = [],
    compileOptions: ICompileOptions = {
      forceRecompile: false,
    }
  ): Promise<Map<string, Contract>> {
    // get all result entries
    const compiledContracts = this.contractHelper.compile(
      contractToCompile,
      compileOptions
    );

    const deployedContractsOutput = new Map<string, Contract>();

    for (const contractToDeploy of contractsToDeploy) {
      console.log(
        `🚢 Deploying contract ${contractToDeploy.contractName} to TEST Network...`
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

      deployedContractsOutput.set(contractToDeploy.contractName, contract);
    }

    this.provider.engine.stop();

    return deployedContractsOutput;
  }

  private async deploy(
    abi: any,
    evm: Evm,
    args: any[] = [],
    gas = 2000000
  ): Promise<Contract> {
    const accounts = await this.getAccounts();
    console.log("Deploying to test network from account: ", accounts[0]);

    const result = await new this.web3.eth.Contract(abi)
      .deploy({
        data: evm.bytecode.object,
        arguments: args,
      })
      .send({ gas, from: accounts[0] });

    console.log("🏁 Contract deployed to ", result.options.address);

    return result as unknown as Contract;
  }
}
