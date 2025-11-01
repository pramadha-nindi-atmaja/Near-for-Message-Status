import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import getConfig from './config.js';
import * as nearAPI from 'near-api-js';

// Error boundary component for catching React errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>Please refresh the page or try again later.</p>
          {process.env.NODE_ENV === 'development' && (
            <pre>{this.state.error?.toString()}</pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

// Loading component
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <h2>Connecting to NEAR...</h2>
      <p>Please wait while we establish connection</p>
    </div>
  );
}

// Initialize NEAR connection and contract
async function initContract() {
  try {
    const nearConfig = getConfig(process.env.NODE_ENV || 'testnet');

    // Initialize connection to NEAR
    const near = await nearAPI.connect({
      keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
      ...nearConfig
    });

    // Initialize wallet connection
    const walletConnection = new nearAPI.WalletConnection(near);

    // Get current user data if logged in
    let currentUser = null;
    if (walletConnection.getAccountId()) {
      try {
        const account = walletConnection.account();
        const state = await account.state();
        currentUser = {
          accountId: walletConnection.getAccountId(),
          balance: state.amount,
          connected: true
        };
      } catch (e) {
        console.error('Failed to load account data:', e);
        currentUser = {
          accountId: walletConnection.getAccountId(),
          connected: false,
          error: 'Failed to load account data'
        };
      }
    }

    // Initialize contract interface
    const contract = new nearAPI.Contract(
      walletConnection.account(),
      nearConfig.contractName,
      {
        viewMethods: ['get_status'],
        changeMethods: ['set_status'],
        sender: walletConnection.getAccountId()
      }
    );

    return { contract, currentUser, nearConfig, walletConnection };
  } catch (error) {
    console.error('Failed to initialize contract:', error);
    throw error;
  }
}

// Root element for React
const container = document.getElementById('root');
const root = createRoot(container);

// Initialize app with loading state
root.render(
  <StrictMode>
    <ErrorBoundary>
      <LoadingScreen />
    </ErrorBoundary>
  </StrictMode>
);

// Initialize NEAR and render app
window.nearInitPromise = initContract()
  .then(({ contract, currentUser, nearConfig, walletConnection }) => {
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App
            contract={contract}
            currentUser={currentUser}
            nearConfig={nearConfig}
            wallet={walletConnection}
          />
        </ErrorBoundary>
      </StrictMode>
    );
  })
  .catch(error => {
    console.error('Initialization failed:', error);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <div className="error-screen">
            <h2>Failed to connect to NEAR</h2>
            <p>There was an error connecting to the NEAR network.</p>
            <button onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        </ErrorBoundary>
      </StrictMode>
    );
  });
