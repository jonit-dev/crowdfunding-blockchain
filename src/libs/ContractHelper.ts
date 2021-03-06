import fs from "fs-extra";
import path from "path";
import solc from "solc";
import {
  ICompileOptions,
  IContractData,
} from "../@types/solidity/smartContractTypes";

export class ContractHelper {
  public compile(
    contractName: string,
    compileOptions: ICompileOptions
  ): Map<string, IContractData> {
    const buildPath = path.resolve(
      __dirname,
      `../contracts/${contractName}/build`
    );

    // skip if build folder exists
    if (fs.existsSync(buildPath) && !compileOptions.forceRecompile) {
      const contractsData = new Map<string, IContractData>();

      // get all files in build folder
      const files = fs.readdirSync(buildPath);

      for (const file of files) {
        const filePath = path.resolve(buildPath, file);
        const fileData = fs.readFileSync(filePath, "utf8");

        const contractData = JSON.parse(fileData);

        contractsData.set(file.replace(".json", ""), contractData);
      }

      return contractsData;
    }

    const contractFullName = `${contractName}.sol`;

    const contractPath = path.resolve(
      __dirname,
      `../contracts/${contractName}`,
      contractFullName
    );

    // delete build folder, if it already exists
    fs.removeSync(buildPath);

    // read contract source code and compile it through solc compiler.

    const source = fs.readFileSync(contractPath, "utf8");

    const input = {
      language: "Solidity",
      sources: {
        [contractFullName]: {
          content: source,
        },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["*"],
          },
        },
      },
    };

    const compiledContracts = JSON.parse(solc.compile(JSON.stringify(input)))
      .contracts[contractFullName];

    fs.ensureDirSync(buildPath); // create build folder if it doesn't exist

    const contractsData = new Map<string, IContractData>();

    for (const [contractName, source] of Object.entries(compiledContracts)) {
      fs.outputJSONSync(
        path.resolve(buildPath, `./${contractName}.json`),
        source
      );
      contractsData.set(contractName, source as IContractData);
    }

    return contractsData;
  }
}
