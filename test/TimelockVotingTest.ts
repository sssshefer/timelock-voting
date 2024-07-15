import { loadFixture, ethers, expect } from "./setup";

describe("AuctionEngine", function () {
    async function deploy() {
        const [owner1, owner2, user1] = await ethers.getSigners();

        const TvFactory = await ethers.getContractFactory("TimelockVoting", owner1);
        const tv = await TvFactory.deploy([owner1, owner2]);
        await tv.waitForDeployment();

        const OtherFactory = await ethers.getContractFactory("OtherContract", owner1);
        const other = await OtherFactory.deploy();
        await other.waitForDeployment();

        return { owner1, owner2, tv, other }
    }
});