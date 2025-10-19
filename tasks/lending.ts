import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

const OPERATOR_EXPIRATION = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

task("lending:faucet", "Mint fheUSDT to the caller")
  .addParam("amount", "Amount to mint using the faucet")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const faucetAmount = BigInt(taskArguments.amount);
    const tokenDeployment = await deployments.get("fheUSDT");
    const [signer] = await ethers.getSigners();

    const token = await ethers.getContractAt("fheUSDT", tokenDeployment.address);
    const tx = await token.connect(signer).faucet(signer.address, faucetAmount);
    await tx.wait();

    console.log(`Minted ${faucetAmount} fheUSDT to ${signer.address}`);
  });

task("lending:deposit", "Deposit fheUSDT into the lending pool")
  .addParam("amount", "Amount to deposit")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const depositAmount = Number(taskArguments.amount);
    const poolDeployment = await deployments.get("FHELendingPool");
    const tokenDeployment = await deployments.get("fheUSDT");
    const [signer] = await ethers.getSigners();

    await fhevm.initializeCLIApi();

    const token = await ethers.getContractAt("fheUSDT", tokenDeployment.address);
    const pool = await ethers.getContractAt("FHELendingPool", poolDeployment.address);

    const expiry = BigInt(OPERATOR_EXPIRATION);
    const setOperatorTx = await token.connect(signer).setOperator(poolDeployment.address, expiry);
    await setOperatorTx.wait();

    const encryptedInput = await fhevm
      .createEncryptedInput(poolDeployment.address, signer.address)
      .add64(depositAmount)
      .encrypt();

    const tx = await pool
      .connect(signer)
      .deposit(encryptedInput.handles[0], encryptedInput.inputProof);
    await tx.wait();

    console.log(`Deposited ${depositAmount} fheUSDT into ${poolDeployment.address}`);
  });

task("lending:borrow", "Borrow fheUSDT from the lending pool")
  .addParam("amount", "Amount to borrow")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const borrowAmount = Number(taskArguments.amount);
    const poolDeployment = await deployments.get("FHELendingPool");
    const [signer] = await ethers.getSigners();

    await fhevm.initializeCLIApi();

    const pool = await ethers.getContractAt("FHELendingPool", poolDeployment.address);

    const encryptedInput = await fhevm
      .createEncryptedInput(poolDeployment.address, signer.address)
      .add64(borrowAmount)
      .encrypt();

    const tx = await pool
      .connect(signer)
      .borrow(encryptedInput.handles[0], encryptedInput.inputProof);
    await tx.wait();

    console.log(`Borrowed ${borrowAmount} fheUSDT from ${poolDeployment.address}`);
  });

task("lending:repay", "Repay borrowed fheUSDT")
  .addParam("amount", "Amount to repay")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const repayAmount = Number(taskArguments.amount);
    const poolDeployment = await deployments.get("FHELendingPool");
    const tokenDeployment = await deployments.get("fheUSDT");
    const [signer] = await ethers.getSigners();

    await fhevm.initializeCLIApi();

    const token = await ethers.getContractAt("fheUSDT", tokenDeployment.address);
    const pool = await ethers.getContractAt("FHELendingPool", poolDeployment.address);

    const expiry = BigInt(OPERATOR_EXPIRATION);
    const setOperatorTx = await token.connect(signer).setOperator(poolDeployment.address, expiry);
    await setOperatorTx.wait();

    const encryptedInput = await fhevm
      .createEncryptedInput(poolDeployment.address, signer.address)
      .add64(repayAmount)
      .encrypt();

    const tx = await pool
      .connect(signer)
      .repay(encryptedInput.handles[0], encryptedInput.inputProof);
    await tx.wait();

    console.log(`Repaid ${repayAmount} fheUSDT to ${poolDeployment.address}`);
  });

task("lending:balances", "Decrypt deposit and debt for the caller").setAction(async function (
  _taskArguments: TaskArguments,
  hre,
) {
  const { ethers, deployments, fhevm } = hre;

  await fhevm.initializeCLIApi();

  const poolDeployment = await deployments.get("FHELendingPool");
  const [signer] = await ethers.getSigners();

  const pool = await ethers.getContractAt("FHELendingPool", poolDeployment.address);

  const accountData = await pool.getAccountData(signer.address);

  if (!accountData || accountData.length < 2) {
    console.log("No encrypted balances found");
    return;
  }

  const deposit = await fhevm.userDecryptEuint(
    FhevmType.euint64,
    accountData[0],
    poolDeployment.address,
    signer,
  );
  const debt = await fhevm.userDecryptEuint(
    FhevmType.euint64,
    accountData[1],
    poolDeployment.address,
    signer,
  );

  console.log(`Deposit balance: ${deposit}`);
  console.log(`Debt balance   : ${debt}`);
});
