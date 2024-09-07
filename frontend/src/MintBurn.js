import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function MBpage() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [amount, setAmount] = useState(0);
  const [mode, setMode] = useState('addCollateral'); // 'redeem', 'mint', 'addCollateral', 'removeCollateral'
  const [selectedToken, setSelectedToken] = useState('INRC'); // Default token
  const [rcoinAmount, setRcoinAmount] = useState(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        setWalletConnected(true);
      } catch (error) {
        console.error("An error occurred during wallet connection:", error);
      }
    } else {
      alert('MetaMask is not installed. Please install it to use this feature.');
    }
  };

  const handleAmountChange = async (e) => {
    const newAmount = e.target.value;
    setAmount(newAmount);

    // Fetch the price and calculate Rcoin amount
    try {
      const response = await fetch('http://localhost:3000/api/calculate-rcoin-amount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: selectedToken,
          amount: newAmount,
        }),
      });

      const result = await response.json();
      setRcoinAmount(result.rcoinAmount);
    } catch (error) {
      console.error('Error fetching Rcoin amount:', error);
    }
  };

  const handleTokenSelection = (token) => {
    setSelectedToken(token);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
  };

  const handleAction = async () => {
    const data = {
      mode,            // Selected mode (addCollateral, removeCollateral, mint, redeem)
      token: selectedToken,  // Selected token (INRC, MATIC, LINK)
      amount,          // Entered amount
    };
  
    try {
      const response = await fetch('http://localhost:3000/api/collateral-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      const result = await response.json();
      alert(`Success: ${result.message}`);
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred during the transaction.');
    }
  };

  return (
    <div className="container mintburn">
      <header>
        <button className="connect-button" onClick={connectWallet}>
          {walletConnected ? `Connected: ${account}` : 'Connect Wallet'}
        </button>
      </header>

      <main className="exchange">
        <div className="exchange-box">
          {/* Options for Adding or Removing Collateral */}
          <div className="collateral-options">
            <button
              className={`collateral-button ${mode === 'addCollateral' ? 'active' : ''}`}
              onClick={() => handleModeChange('addCollateral')}
              disabled={!walletConnected}
            >
              Add Collateral
            </button>
          </div>

          {/* Mint Navigation for Token Selection */}
          <div className="mint-options">
            <button
              className={`mint-token-button ${selectedToken === 'INRC' ? 'active' : ''}`}
              onClick={() => handleTokenSelection('INRC')}
              disabled={!walletConnected}
            >
              INRC
            </button>
            <button
              className={`mint-token-button ${selectedToken === 'MATIC' ? 'active' : ''}`}
              onClick={() => handleTokenSelection('MATIC')}
              disabled={!walletConnected}
            >
              MATIC
            </button>
            <button
              className={`mint-token-button ${selectedToken === 'LINK' ? 'active' : ''}`}
              onClick={() => handleTokenSelection('LINK')}
              disabled={!walletConnected}
            >
              LINK
            </button>
          </div>

          {/* Input for Token Amount */}
          <div className="token">
            <label htmlFor="amount">{selectedToken}</label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={handleAmountChange}
              placeholder={`Enter amount for ${selectedToken}`}
              disabled={!walletConnected}
            />
          </div>
          <div>
          {rcoinAmount !== null && (
              <div className="rcoin-amount">
               Rcoin Amount: {ethers.formatUnits(rcoinAmount, 18)}
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            className="redeem-button"
            onClick={handleAction}
            disabled={!walletConnected || amount <= 0}
          >
            {mode === 'redeem' ? 'Redeem' : mode === 'mint' ? `Mint ${selectedToken}` : mode === 'addCollateral' ? 'Add Collateral' : 'Remove Collateral'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default MBpage;
