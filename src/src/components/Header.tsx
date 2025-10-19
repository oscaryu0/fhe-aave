import { ConnectButton } from '@rainbow-me/rainbowkit';
import '../styles/Header.css';

export function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-title">fheUSDT Lending Vault</h1>
            <span className="header-badge">Encrypted DeFi</span>
          </div>
          <ConnectButton label="Connect" chainStatus="icon" showBalance={false} />
        </div>
      </div>
    </header>
  );
}
