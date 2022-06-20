const hre = require("hardhat");

async function deploy() {
    const rrpAddress = "0xa0AD79D995DdeeB18a14eAef56A549A04e3Aa1Bd";

    const requesterFactory = await hre.ethers.getContractFactory("Requester");
    const requesterContract = await requesterFactory.deploy(rrpAddress);
    await requesterContract.deployed();

    const txn = requesterContract.deployTransaction;
    console.log(`Requester deployed to: ${requesterContract.address} [txn id: ${txn.hash}]`);
}

const runDeploy = async () => {
    try {
        await deploy();
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

runDeploy();