import { expect } from "chai";
import hre, { deployments, ethers } from "hardhat";

const ONE_HOUR = 60 * 60;
async function encryptAmount(contractAddress: string, userAddress: string, amount: number) {
  await hre.fhevm.initializeCLIApi();
  return hre.fhevm.createEncryptedInput(contractAddress, userAddress).add64(amount).encrypt();
}

describe("FHELendingPool", function () {
  beforeEach(async function () {
    await deployments.fixture(["Lending"]);
  });

  it("handles deposits and withdrawals", async function () {
    const poolDeployment = await deployments.get("FHELendingPool");
    const tokenDeployment = await deployments.get("fheUSDT");

    const pool = await ethers.getContractAt("FHELendingPool", poolDeployment.address);
    const token = await ethers.getContractAt("fheUSDT", tokenDeployment.address);

    const [, user] = await ethers.getSigners();

    await token.faucet(user.address, 1_000n);
    const expiry = BigInt(Math.floor(Date.now() / 1000) + ONE_HOUR * 24);
    await token.connect(user).setOperator(poolDeployment.address, expiry);

    const depositAmount = 200;
    let encryptedInput = await encryptAmount(poolDeployment.address, user.address, depositAmount);
    await pool.connect(user).deposit(encryptedInput.handles[0], encryptedInput.inputProof);

    const accountDataAfterDeposit = await pool.getAccountData(user.address);
    expect(accountDataAfterDeposit).to.have.lengthOf(2);
    expect(typeof accountDataAfterDeposit[0]).to.equal("string");
    expect(typeof accountDataAfterDeposit[1]).to.equal("string");

    const withdrawAmount = 80;
    encryptedInput = await encryptAmount(poolDeployment.address, user.address, withdrawAmount);
    await pool.connect(user).withdraw(encryptedInput.handles[0], encryptedInput.inputProof);

    const accountDataAfterWithdraw = await pool.getAccountData(user.address);
    expect(accountDataAfterWithdraw).to.have.lengthOf(2);
    expect(typeof accountDataAfterWithdraw[0]).to.equal("string");
    expect(typeof accountDataAfterWithdraw[1]).to.equal("string");

    const totals = await pool.getTotals();
    expect(totals).to.have.lengthOf(3);
    expect(typeof totals[0]).to.equal("string");
    expect(typeof totals[1]).to.equal("string");
    expect(typeof totals[2]).to.equal("string");
  });

  it("supports borrowing and repayment", async function () {
    const poolDeployment = await deployments.get("FHELendingPool");
    const tokenDeployment = await deployments.get("fheUSDT");

    const pool = await ethers.getContractAt("FHELendingPool", poolDeployment.address);
    const token = await ethers.getContractAt("fheUSDT", tokenDeployment.address);

    const [, user] = await ethers.getSigners();

    await token.faucet(user.address, 1_000n);
    const expiry = BigInt(Math.floor(Date.now() / 1000) + ONE_HOUR * 24);
    await token.connect(user).setOperator(poolDeployment.address, expiry);

    const depositAmount = 500;
    let encryptedInput = await encryptAmount(poolDeployment.address, user.address, depositAmount);
    await pool.connect(user).deposit(encryptedInput.handles[0], encryptedInput.inputProof);

    const borrowAmount = 180;
    encryptedInput = await encryptAmount(poolDeployment.address, user.address, borrowAmount);
    await pool.connect(user).borrow(encryptedInput.handles[0], encryptedInput.inputProof);

    let accountData = await pool.getAccountData(user.address);
    expect(accountData).to.have.lengthOf(2);
    expect(typeof accountData[0]).to.equal("string");
    expect(typeof accountData[1]).to.equal("string");

    const totalsAfterBorrow = await pool.getTotals();
    expect(totalsAfterBorrow[0]).to.equal(accountData[0]);
    expect(totalsAfterBorrow[1]).to.equal(accountData[1]);

    const repayAmount = 120;
    encryptedInput = await encryptAmount(poolDeployment.address, user.address, repayAmount);
    await pool.connect(user).repay(encryptedInput.handles[0], encryptedInput.inputProof);

    accountData = await pool.getAccountData(user.address);
    expect(accountData).to.have.lengthOf(2);
    expect(typeof accountData[0]).to.equal("string");
    expect(typeof accountData[1]).to.equal("string");

    expect(accountData[1]).to.not.equal(totalsAfterBorrow[1]);

    const totalsAfterRepay = await pool.getTotals();
    expect(totalsAfterRepay[0]).to.equal(accountData[0]);
    expect(totalsAfterRepay[1]).to.equal(accountData[1]);
  });
});
