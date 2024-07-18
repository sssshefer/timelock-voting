import { loadFixture, ethers, expect } from "./setup";
import { ContractTransactionReceipt, ContractTransaction, Log, EventLog, ContractTransactionResponse, Signer} from "ethers";
import { TimelockVoting } from "../typechain-types";

describe("TimelockVoting", function () {
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

    async function addTxToQueue(props:{
        contract:TimelockVoting & {
            deploymentTransaction(): ContractTransactionResponse;
        }
        to:Signer ,
        func?: string,
        data?: string,
        value?: number | bigint,
        execTimestamp?: number
    }) {
        const abi = new ethers.AbiCoder();

        const execDelay = 60;
        const currentTimestamp = Math.round(new Date().getTime() / 1000)

        const _to = props.to;
        const _func = props?.func || abi.encode(["string"], ["someTestFunction(string)"]);
        const _data = props?.data || abi.encode(["string"], ["Hiiii test"]);
        const _value = props?.value || ethers.parseEther("0.1");
        const _execTimestamp = props?.execTimestamp || currentTimestamp + execDelay;

        const tx = await props.contract.addToQueue(
            _to,
            _func,
            _data,
            _value,
            _execTimestamp
        );

        const rc = await tx.wait();
        const txCach = await getArgFromTxReceipt(rc, 0);

        expect((await props.contract.Transactions(txCach)).queued).to.eq(true);
        expect(tx).to.emit(props.contract, "Queue");

        await ethers.provider.send("evm_increaseTime", [70]);
        return {txCach, rc};
    }

    async function getArgFromTxReceipt (rc:ContractTransactionReceipt|null,index:number){
        const log = rc?.logs[0] as EventLog;
        const arg = log?.args[index];
        return arg;
    }

    describe("adding to queue", function () {
        it("Correct scenario", async function () {
            const { owner1, owner2, tv, other } = await loadFixture(deploy);

            await addTxToQueue({to:owner1, contract:tv});
        })

        it("Incorrect delay", async function () {
            const { owner1, owner2, tv, other } = await loadFixture(deploy);

            const execDelay = 5;
            const currentTimestamp = Math.round(new Date().getTime() / 1000)
            const execTimestamp = currentTimestamp + execDelay;

            expect(
                addTxToQueue({to:owner1, contract:tv, execTimestamp}) 
            ).to.be.revertedWith("Incorrect execution timestamp");
        })

        it("Queueing same transaction", async function () {
            const { owner1, owner2, tv, other } = await loadFixture(deploy);

            await addTxToQueue({to:owner1, contract:tv});

            expect(
                addTxToQueue({to:owner1, contract:tv})

            ).to.be.rejectedWith("Already queued");
        })
    })

    describe("Confirming transaction", function () {
        it("Correct scenario", async function () {
            const { owner1, owner2, tv, other } = await loadFixture(deploy);

            const {txCach} = await addTxToQueue({to:owner1, contract:tv});
            await ethers.provider.send("evm_increaseTime", [70]);
            await tv.confirm(txCach);

            const TxInStorage =  await tv.Transactions(txCach);
            expect(TxInStorage.confirmationsAmount).to.eq(1);
            //expect(TxInStorage.confirmations).to.eq(1);
        })
    })

    describe("Executing transaction", function () {
        it("Correct scenario", async function () {
            const { owner1, owner2, tv, other } = await loadFixture(deploy);

            const {txCach} = await addTxToQueue({to:owner1, contract:tv});
            await ethers.provider.send("evm_increaseTime", [70]);
            await tv.confirm(txCach);

            expect(await other.callCount()).to.eq(0);

            // const txExec = await tv.execute(
            //     to.address,
            //     func,
            //     data,
            //     value,
            //     execTimestamp
            //     , { value: value });
            // await txExec.wait();
            
            // expect(await other.callCount()).to.eq(1);
        })
    })
});

