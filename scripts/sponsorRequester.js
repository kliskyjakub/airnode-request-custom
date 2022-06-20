require("dotenv").config();
const hre = require("hardhat");
const airnodeAbi = require("@api3/airnode-protocol").AirnodeRrpFactory.abi;

async function sponsorRequester() {
    const rrpAddress = "0xa0AD79D995DdeeB18a14eAef56A549A04e3Aa1Bd";
    const requesterContract = "0xb4f8509fd8038f6eE162788Be214b16Db0dA8aB6";

    const rrpContract = await hre.ethers.getContractAt(airnodeAbi, rrpAddress);
    const txn = await rrpContract.setSponsorshipStatus(requesterContract, true)
    console.log(`Sponsored Requester: ${requesterContract} [txn id: ${txn.hash}]`);
}

const runSponsorRequester = async () => {
    try {
        await sponsorRequester();
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

runSponsorRequester();