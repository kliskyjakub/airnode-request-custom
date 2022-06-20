require("dotenv").config();
const hre = require("hardhat");
const airnodeAbi = require("@api3/airnode-protocol").AirnodeRrpFactory.abi;
const {encode} = require("@api3/airnode-abi");

async function main() {

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

    const requestId = await new Promise(resolve =>
        hre.ethers.provider.once(txn.hash, tx => {
            const parsedLog = rrpContract.interface.parseLog(tx.logs[0]);
            resolve(parsedLog.args.requestId);
        })
    );

    console.log(`Request ID: ${requestId}`);

    // await requesterContract.fulfill(
    //     requestId,
    //     txn.data
    // ).then(function (data) {
    //     console.log(data)
    // });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });