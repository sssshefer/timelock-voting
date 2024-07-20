import { loadFixture, ethers, expect } from "./setup";
import { ContractTransactionReceipt, ContractTransaction, Log, EventLog, ContractTransactionResponse, Signer, AddressLike } from "ethers";
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

    async function addTxToQueue(props: {
        contract: TimelockVoting & {
            deploymentTransaction(): ContractTransactionResponse;
        }
        to: AddressLike,
        func?: string,
        data?: string,
        value?: number | bigint,
        execTimestamp?: number
    }) {

        const execDelay = 60;
        const currentTimestamp = Math.round(new Date().getTime() / 1000)

        const _to = props.to;
        const _func = props?.func || "someTestFunc(string)";
        const _data = props?.data || "Hiiii test";
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
        return { txCach, rc };
    }

    function getArgFromTxReceipt(rc: ContractTransactionReceipt | null, index: number) {
        const log = rc?.logs[0] as EventLog;
        const arg = log?.args[index];
        return arg;
    }

    describe("Adding to queue", function () {
        it("Correct scenario", async function () {
            const { owner1, owner2, tv, other } = await loadFixture(deploy);

            await addTxToQueue({ to: owner1, contract: tv });
        })

        it("Incorrect delay", async function () {
            const { owner1, owner2, tv, other } = await loadFixture(deploy);

            const execDelay = 5;
            const currentTimestamp = Math.round(new Date().getTime() / 1000)
            const execTimestamp = currentTimestamp + execDelay;

            expect(
                addTxToQueue({ to: other, contract: tv, execTimestamp })
            ).to.be.revertedWith("Incorrect execution timestamp");
        })

        it("Queueing same transaction", async function () {
            const { owner1, owner2, tv, other } = await loadFixture(deploy);

            await addTxToQueue({ to: other, contract: tv });

            expect(
                addTxToQueue({ to: other, contract: tv })

            ).to.be.rejectedWith("Already queued");
        })
    })

    describe("Confirming transaction", function () {
        it("Correct scenario", async function () {
            const { owner1, owner2, tv, other } = await loadFixture(deploy);

            const { txCach } = await addTxToQueue({ to: other, contract: tv });
            await ethers.provider.send("evm_increaseTime", [70]);
            const tx = await tv.confirm(txCach);
            await tx.wait()
            const TxInStorage = await tv.Transactions(txCach);
            expect(TxInStorage.confirmationsAmount).to.eq(1);
            const confirmation = await tv.getConfirmation(txCach, owner1);          
            expect(confirmation).to.eq(true);
        })
    })

    describe("Executing transaction", function () {
        it("Correct scenario", async function () {
            const { owner1, owner2, tv, other } = await loadFixture(deploy);

            const abi = new ethers.AbiCoder();

            const execDelay = 60;
            const currentTimestamp = Math.round(new Date().getTime() / 1000);
            const _func = "someTestFunc(string)";
            const _data = "Hiiii test";
            const _value = 10000000;
            
            const _execTimestamp = currentTimestamp + execDelay;

            const { txCach } = await addTxToQueue({
                to: other,
                contract: tv,
                func: _func,
                data: _data,
                value: _value,
                execTimestamp: _execTimestamp

            });
            await ethers.provider.send("evm_increaseTime", [70]);
            await tv.confirm(txCach);
            await tv.connect(owner2).confirm(txCach);

            expect(await other.callCount()).to.eq(0);

            const tx = await tv.execute(
                other,
                _func,
                _data,
                _execTimestamp,
                {
                    value:_value
                }
            );
           
            const rc = await tx.wait();

            
            expect(await other.callCount()).to.eq(1);
        })
    })
});

