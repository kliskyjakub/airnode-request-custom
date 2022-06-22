require("dotenv").config();
const hre = require("hardhat");
const airnodeAbi = require("@api3/airnode-protocol").AirnodeRrpFactory.abi;
const {encode} = require("@api3/airnode-abi");

const rrpAddress = "0xa0AD79D995DdeeB18a14eAef56A549A04e3Aa1Bd";
const requesterAddress = "0xb4f8509fd8038f6eE162788Be214b16Db0dA8aB6";
const requesterArtifacts = require("../artifacts/contracts/Requester.sol/Requester.json");
const sponsorAddress = "0x75c609caaf6f98b9cae92b1e0b4112029de3f860";
// TODO: derive sponsor wallet address
const sponsorWalletAddress = "0x75c609caaf6f98b9cae92b1e0b4112029de3f860";
const endpointId = "0x2ef0d3d8c2ebd31ec9246001c3b5090dcda2f40001642a978a8a11bda63ee7d0";
const params = {
    "_path": "value",
    "_type": "string",
    "account": "0x4baad650a6e58c4d3be40358657bac526927b53d"
}

// export const printResponse = async (requestId: string) => {
//     const integrationInfo = readIntegrationInfo();
//     const requester = await getDeployedContract(`contracts/${integrationInfo.integration}/Requester.sol`);
//
//     // Divided by 1e6, because the response value is multiplied with 1e6 by Airnode
//     cliPrint.info(`${coinLabel} price is ${(await requester.fulfilledData(requestId)) / 1e6} USD`);
// };

const setMaxPromiseTimeout = (promise, timeoutMs) => {
    Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject('Timeout exceeded!'), timeoutMs))]);
}

const waitForFulfillment = async (requestId) => {

    const rrpContract = await hre.ethers.getContractAt(airnodeAbi, rrpAddress);

    const fulfilled = new Promise((resolve) =>
        hre.ethers.provider.once(rrpContract.filters.FulfilledRequest(null, requestId), resolve)
    );
    const failed = new Promise((resolve) =>
        hre.ethers.provider.once(rrpContract.filters.FailedRequest(null, requestId), resolve)
    ).then((rawRequestFailedLog) => {
        // const log = rrpContract.interface.parseLog(rawRequestFailedLog as ethers.Event);
        // throw new Error(`Request failed. Reason:\n${log.args.errorMessage}`);
        console.log("error")
    });

    // Airnode request can either:
    // 1) be fulfilled - in that case this promise resolves
    // 2) fail - in that case, this promise rejects and this function throws an error
    // 3) never be processed - this means the request is invalid or a bug in Airnode. This should not happen.
    await Promise.race([fulfilled, failed]);
};

const makeRequest = async () => {

    //getting rrp
    const rrpContract = await hre.ethers.getContractAt(airnodeAbi, rrpAddress);

    //getting requester
    const requesterContract = await hre.ethers.getContractAt(requesterArtifacts.abi, requesterAddress);

    let params1 = [];
    for (let key in params) {
        params1.push({
            type: "string",
            name: key,
            value: key === "_type" ? "string" : params[key],
        });
    }

    const txn = await requesterContract.makeRequest(
        rrpAddress,
        endpointId,
        sponsorAddress,
        sponsorWalletAddress,
        encode(params1)
    );

    console.log(`Request made: ${requesterContract.address} [txn id: ${txn.hash}]`);

    // Wait until the transaction is mined
    return new Promise((resolve) =>
        hre.ethers.provider.once(txn.hash, (tx) => {
            const parsedLog = rrpContract.interface.parseLog(tx.logs[0]);
            resolve(parsedLog.args.requestId);
        })
    );
};

async function main() {
    console.log("Making the request")
    const requestId = await makeRequest();
    console.log("Waiting for fulfillment...")
    await setMaxPromiseTimeout(waitForFulfillment(requestId), 180 * 1000);
    console.log("Request fulfilled")

    const requesterContract = await hre.ethers.getContractAt(requesterArtifacts.abi, requesterAddress);
    const encodedData = await requesterContract.encodedData(requestId);
    const decodedData = await requesterContract.decodedData(requestId);
    console.log("---------------------------")
    console.log({encodedData});
    console.log({decodedData});
    console.log("---------------------------")
    // console.log(requesterContract)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });