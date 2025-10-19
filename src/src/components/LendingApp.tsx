import { useEffect, useState } from 'react';
import { Contract, JsonRpcSigner } from 'ethers';
import { useAccount, useReadContract } from 'wagmi';

import { Header } from './Header';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import {
  LENDING_POOL_ADDRESS,
  LENDING_POOL_ABI,
  FHE_USDT_ADDRESS,
  FHE_USDT_ABI,
} from '../config/contracts';
import '../styles/LendingApp.css';

type HandleMap = Record<string, string>;

const SECONDS_IN_DAY = 24 * 60 * 60;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

function isValidAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/i.test(value) && value.toLowerCase() !== ZERO_ADDRESS;
}

export function LendingApp() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const { instance, isLoading: zamaLoading, error: zamaError } = useZamaInstance();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [faucetAmount, setFaucetAmount] = useState('100');

  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const [balances, setBalances] = useState({ deposit: '0', debt: '0' });
  const [poolMetrics, setPoolMetrics] = useState({ totalDeposits: '0', totalBorrows: '0', poolBalance: '0' });
  const [isDecryptingBalances, setIsDecryptingBalances] = useState(false);
  const [isDecryptingPool, setIsDecryptingPool] = useState(false);
  const [hasDecryptedBalances, setHasDecryptedBalances] = useState(false);
  const [hasDecryptedPool, setHasDecryptedPool] = useState(false);
  const [operatorGranted, setOperatorGranted] = useState(false);

  const poolConfigured = isValidAddress(LENDING_POOL_ADDRESS);
  const tokenConfigured = isValidAddress(FHE_USDT_ADDRESS);

  useEffect(() => {
    setOperatorGranted(false);
  }, [address]);

  const { data: accountData, refetch: refetchAccountData } = useReadContract({
    address: LENDING_POOL_ADDRESS as `0x${string}`,
    abi: LENDING_POOL_ABI,
    functionName: 'getAccountData',
    args: address && poolConfigured ? [address] : undefined,
    query: {
      enabled: Boolean(address && poolConfigured),
    },
  });

  const { data: totalsData, refetch: refetchTotals } = useReadContract({
    address: LENDING_POOL_ADDRESS as `0x${string}`,
    abi: LENDING_POOL_ABI,
    functionName: 'getTotals',
    args: undefined,
    query: {
      enabled: Boolean(poolConfigured),
    },
  });

  async function ensureOperator(signer: JsonRpcSigner) {
    if (!tokenConfigured) throw new Error('Token address is not configured.');
    if (operatorGranted) return;

    const token = new Contract(FHE_USDT_ADDRESS, FHE_USDT_ABI, signer);
    const windowSeconds = BigInt(Math.floor(Date.now() / 1000) + SECONDS_IN_DAY);
    const tx = await token.setOperator(LENDING_POOL_ADDRESS, windowSeconds);
    await tx.wait();
    setOperatorGranted(true);
  }

  async function decryptHandles(handles: readonly unknown[] | undefined): Promise<HandleMap | null> {
    if (!instance || !address || !handles || !signerPromise || !poolConfigured) {
      return null;
    }

    const filteredHandles = handles.filter((value): value is string => typeof value === 'string');
    if (!filteredHandles.length) {
      return null;
    }

    const signer = await signerPromise;
    if (!signer) {
      return null;
    }

    const keypair = instance.generateKeypair();
    const contractAddresses = [LENDING_POOL_ADDRESS];
    const startTimestamp = Math.floor(Date.now() / 1000).toString();
    const durationDays = '5';

    const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, startTimestamp, durationDays);

    const signature = await signer.signTypedData(
      eip712.domain,
      {
        UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
      },
      eip712.message,
    );

    const handleContractPairs = filteredHandles.map((handle) => ({
      handle,
      contractAddress: LENDING_POOL_ADDRESS,
    }));

    const result = await instance.userDecrypt(
      handleContractPairs,
      keypair.privateKey,
      keypair.publicKey,
      signature.replace('0x', ''),
      contractAddresses,
      address,
      startTimestamp,
      durationDays,
    );

    return result as HandleMap;
  }

  useEffect(() => {
    setIsDecryptingBalances(false);
    setHasDecryptedBalances(false);
    setBalances({ deposit: '0', debt: '0' });
  }, [accountData, address]);

  useEffect(() => {
    setIsDecryptingPool(false);
    setHasDecryptedPool(false);
    setPoolMetrics({ totalDeposits: '0', totalBorrows: '0', poolBalance: '0' });
  }, [totalsData]);

  async function handleAction(
    label: string,
    amountInput: string,
    action: (signer: JsonRpcSigner, amount: number) => Promise<void>,
  ): Promise<boolean> {
    setError('');
    setFeedback('');

    if (!instance) {
      setError('Encryption service is not ready.');
      return false;
    }

    if (!address) {
      setError('Connect your wallet to continue.');
      return false;
    }

    if (!poolConfigured) {
      setError('Lending pool address is not configured.');
      return false;
    }

    const parsedAmount = Number(amountInput);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a positive amount.');
      return false;
    }

    if (!signerPromise) {
      setError('Signer is not available.');
      return false;
    }

    setPendingAction(label);
    let success = false;

    try {
      const signer = await signerPromise;
      if (!signer) {
        throw new Error('Signer resolution failed.');
      }

      await action(signer, parsedAmount);
      success = true;
      setFeedback(`${label} ${parsedAmount} fheUSDT completed.`);
      await refetchAccountData();
      await refetchTotals();
    } catch (err) {
      console.error(`${label} failed`, err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`${label} failed: ${message}`);
    } finally {
      setPendingAction(null);
    }

    return success;
  }

  async function encryptForPool(signer: JsonRpcSigner, amount: number) {
    if (!instance) {
      throw new Error('Encryption service is not ready.');
    }

    await ensureOperator(signer);
    const builder = instance.createEncryptedInput(LENDING_POOL_ADDRESS, await signer.getAddress());
    return builder.add64(amount).encrypt();
  }

  async function handleDecryptBalances() {
    setError('');
    setFeedback('');

    if (!address) {
      setError('Connect your wallet to decrypt balances.');
      return;
    }

    if (!accountData) {
      setError('Balances are not available yet.');
      return;
    }

    try {
      setIsDecryptingBalances(true);
      const decrypted = await decryptHandles(accountData as readonly unknown[]);
      if (!decrypted) {
        throw new Error('Decryption service did not return balances.');
      }

      const depositHandle = accountData?.[0] as string | undefined;
      const debtHandle = accountData?.[1] as string | undefined;

      setBalances({
        deposit: depositHandle ? decrypted[depositHandle] ?? '0' : '0',
        debt: debtHandle ? decrypted[debtHandle] ?? '0' : '0',
      });
      setHasDecryptedBalances(true);
      setFeedback('Balances decrypted successfully.');
    } catch (err) {
      console.error('Balances decrypt failed', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Decrypt balances failed: ${message}`);
    } finally {
      setIsDecryptingBalances(false);
    }
  }

  async function handleDecryptPoolMetrics() {
    setError('');
    setFeedback('');

    if (!address) {
      setError('Connect your wallet to decrypt pool metrics.');
      return;
    }

    if (!totalsData) {
      setError('Pool metrics are not available yet.');
      return;
    }

    try {
      setIsDecryptingPool(true);
      const decrypted = await decryptHandles(totalsData as readonly unknown[]);
      if (!decrypted) {
        throw new Error('Decryption service did not return pool metrics.');
      }

      const totalsArray = totalsData as readonly string[];
      setPoolMetrics({
        totalDeposits: totalsArray[0] ? decrypted[totalsArray[0]] ?? '0' : '0',
        totalBorrows: totalsArray[1] ? decrypted[totalsArray[1]] ?? '0' : '0',
        poolBalance: totalsArray[2] ? decrypted[totalsArray[2]] ?? '0' : '0',
      });
      setHasDecryptedPool(true);
      setFeedback('Pool metrics decrypted successfully.');
    } catch (err) {
      console.error('Pool metrics decrypt failed', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Decrypt pool metrics failed: ${message}`);
    } finally {
      setIsDecryptingPool(false);
    }
  }

  const isBusy = Boolean(pendingAction) || zamaLoading;

  return (
    <div className="app-shell">
      <Header />

      <main className="content">
        <section className="overview">
          <div className="overview-text">
            <h2>Fully encrypted lending vault</h2>
            <p>
              Deposit fheUSDT, earn a confidential balance, and borrow privately without revealing amounts on-chain.
            </p>
          </div>
          <div className="overview-actions">
            <button
              type="button"
              className="decrypt-button"
              onClick={handleDecryptBalances}
              disabled={isDecryptingBalances || isBusy || !accountData || !poolConfigured}
            >
              {isDecryptingBalances ? 'Decrypting balances…' : hasDecryptedBalances ? 'Balances decrypted' : 'Decrypt my balances'}
            </button>
            <button
              type="button"
              className="decrypt-button"
              onClick={handleDecryptPoolMetrics}
              disabled={isDecryptingPool || isBusy || !totalsData || !poolConfigured}
            >
              {isDecryptingPool ? 'Decrypting pool…' : hasDecryptedPool ? 'Pool decrypted' : 'Decrypt pool metrics'}
            </button>
          </div>
          <div className="status-cards">
            <div className="status-card">
              <span className="label">My Deposit</span>
              <span className="value">
                {isDecryptingBalances
                  ? 'Decrypting…'
                  : hasDecryptedBalances
                  ? `${balances.deposit} fheUSDT`
                  : 'Encrypted'}
              </span>
            </div>
            <div className="status-card">
              <span className="label">My Debt</span>
              <span className="value">
                {isDecryptingBalances
                  ? 'Decrypting…'
                  : hasDecryptedBalances
                  ? `${balances.debt} fheUSDT`
                  : 'Encrypted'}
              </span>
            </div>
            <div className="status-card">
              <span className="label">Pool Liquidity</span>
              <span className="value">
                {isDecryptingPool
                  ? 'Decrypting…'
                  : hasDecryptedPool
                  ? `${poolMetrics.poolBalance} fheUSDT`
                  : 'Encrypted'}
              </span>
            </div>
          </div>
        </section>

        <section className="actions">
          <div className="action-card">
            <h3>Deposit</h3>
            <p>Move fheUSDT into the vault to unlock borrowing power.</p>
            <input
              type="number"
              min="0"
              value={depositAmount}
              onChange={(event) => setDepositAmount(event.target.value)}
              placeholder="Amount"
            />
            <button
              disabled={isBusy}
              onClick={() =>
                handleAction('Depositing', depositAmount, async (signer, amount) => {
                  const input = await encryptForPool(signer, amount);
                  const pool = new Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer);
                  await pool.deposit(input.handles[0], input.inputProof);
                }).then((success) => success && setDepositAmount(''))
              }
            >
              {pendingAction === 'Depositing' ? 'Depositing…' : 'Deposit'}
            </button>
          </div>

          <div className="action-card">
            <h3>Withdraw</h3>
            <p>Redeem part of your encrypted position back to your wallet.</p>
            <input
              type="number"
              min="0"
              value={withdrawAmount}
              onChange={(event) => setWithdrawAmount(event.target.value)}
              placeholder="Amount"
            />
            <button
              disabled={isBusy}
              onClick={() =>
                handleAction('Withdrawing', withdrawAmount, async (signer, amount) => {
                  if (!instance) throw new Error('Encryption service is not ready.');
                  const builder = instance.createEncryptedInput(
                    LENDING_POOL_ADDRESS,
                    await signer.getAddress(),
                  );
                  const input = await builder.add64(amount).encrypt();
                  const pool = new Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer);
                  await pool.withdraw(input.handles[0], input.inputProof);
                }).then((success) => success && setWithdrawAmount(''))
              }
            >
              {pendingAction === 'Withdrawing' ? 'Withdrawing…' : 'Withdraw'}
            </button>
          </div>

          <div className="action-card">
            <h3>Borrow</h3>
            <p>Draw confidential liquidity against your deposit in seconds.</p>
            <input
              type="number"
              min="0"
              value={borrowAmount}
              onChange={(event) => setBorrowAmount(event.target.value)}
              placeholder="Amount"
            />
            <button
              disabled={isBusy}
              onClick={() =>
                handleAction('Borrowing', borrowAmount, async (signer, amount) => {
                  if (!instance) throw new Error('Encryption service is not ready.');
                  const builder = instance.createEncryptedInput(
                    LENDING_POOL_ADDRESS,
                    await signer.getAddress(),
                  );
                  const input = await builder.add64(amount).encrypt();
                  const pool = new Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer);
                  await pool.borrow(input.handles[0], input.inputProof);
                }).then((success) => success && setBorrowAmount(''))
              }
            >
              {pendingAction === 'Borrowing' ? 'Borrowing…' : 'Borrow'}
            </button>
          </div>

          <div className="action-card">
            <h3>Repay</h3>
            <p>Return borrowed funds to recover available collateral.</p>
            <input
              type="number"
              min="0"
              value={repayAmount}
              onChange={(event) => setRepayAmount(event.target.value)}
              placeholder="Amount"
            />
            <button
              disabled={isBusy}
              onClick={() =>
                handleAction('Repaying', repayAmount, async (signer, amount) => {
                  await ensureOperator(signer);
                  if (!instance) throw new Error('Encryption service is not ready.');
                  const builder = instance.createEncryptedInput(
                    LENDING_POOL_ADDRESS,
                    await signer.getAddress(),
                  );
                  const input = await builder.add64(amount).encrypt();
                  const pool = new Contract(LENDING_POOL_ADDRESS, LENDING_POOL_ABI, signer);
                  await pool.repay(input.handles[0], input.inputProof);
                }).then((success) => success && setRepayAmount(''))
              }
            >
              {pendingAction === 'Repaying' ? 'Repaying…' : 'Repay'}
            </button>
          </div>
        </section>

        <section className="utility">
          <div className="utility-card">
            <h3>Faucet</h3>
            <p>Top up fheUSDT from the demo faucet before entering the vault.</p>
            <div className="utility-row">
              <input
                type="number"
                min="0"
                value={faucetAmount}
                onChange={(event) => setFaucetAmount(event.target.value)}
                placeholder="Amount"
              />
              <button
                disabled={isBusy || !tokenConfigured}
                onClick={() =>
                  handleAction('Minting', faucetAmount, async (signer, amount) => {
                    const token = new Contract(FHE_USDT_ADDRESS, FHE_USDT_ABI, signer);
                    const target = await signer.getAddress();
                    await token.faucet(target, BigInt(amount));
                  }).then((success) => success && setFaucetAmount('100'))
                }
              >
                {pendingAction === 'Minting' ? 'Minting…' : 'Mint to Wallet'}
              </button>
            </div>
          </div>

          <div className="metrics-card">
            <h3>Pool Metrics</h3>
            <ul>
              <li>
                <span>Total Deposits</span>
                <strong>
                  {isDecryptingPool
                    ? 'Decrypting…'
                    : hasDecryptedPool
                    ? `${poolMetrics.totalDeposits} fheUSDT`
                    : 'Encrypted'}
                </strong>
              </li>
              <li>
                <span>Total Borrows</span>
                <strong>
                  {isDecryptingPool
                    ? 'Decrypting…'
                    : hasDecryptedPool
                    ? `${poolMetrics.totalBorrows} fheUSDT`
                    : 'Encrypted'}
                </strong>
              </li>
              <li>
                <span>Utilization</span>
                <strong>
                  {isDecryptingPool
                    ? 'Decrypting…'
                    : hasDecryptedPool && Number(poolMetrics.totalDeposits) > 0
                    ? `${((Number(poolMetrics.totalBorrows) / Number(poolMetrics.totalDeposits)) * 100).toFixed(1)}%`
                    : hasDecryptedPool
                    ? '0%'
                    : 'Encrypted'}
                </strong>
              </li>
            </ul>
          </div>
        </section>

        <section className="messages">
          {zamaError && <div className="alert alert-error">{zamaError}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          {feedback && <div className="alert alert-success">{feedback}</div>}
          {!poolConfigured && (
            <div className="alert alert-warning">
              Configure the lending pool address to enable on-chain actions.
            </div>
          )}
          {!tokenConfigured && (
            <div className="alert alert-warning">Configure the fheUSDT address to interact with the faucet.</div>
          )}
        </section>
      </main>
    </div>
  );
}
