import "regenerator-runtime/runtime";
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Big from "big.js";
import Form from "./components/Form";

const BOATLOAD_OF_GAS = Big(3)
  .times(10 ** 13)
  .toFixed();

const App = ({ contract, currentUser, nearConfig, wallet }) => {
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    if (!currentUser) return;
    try {
      const status = await contract.get_status({
        account_id: currentUser.accountId,
      });
      setStatus(status);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setError('Failed to load status. Please try again.');
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [currentUser]);

  const onSubmit = async ({ message }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await contract.set_status(
        {
          message,
          account_id: currentUser.accountId,
        },
        BOATLOAD_OF_GAS
      );
      
      await fetchStatus();
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update status. Please try again.');
    } finally {
      setIsLoading(false);
    }

  };

  const signIn = () => {
    wallet.requestSignIn(nearConfig.contractName, "NEAR Status Message");
  };

  const signOut = () => {
    wallet.signOut();
    window.location.replace(window.location.origin + window.location.pathname);
  };

  return (
    <main>
      <header>
        <h1>NEAR Status Message</h1>

        {currentUser ? (
          <p>
            Currently signed in as: <code>{currentUser.accountId}</code>
          </p>
        ) : (
          <p>Update or add a status message! Please login to continue.</p>
        )}

        {currentUser ? (
          <button onClick={signOut}>Log out</button>
        ) : (
          <button onClick={signIn}>Log in</button>
        )}
      </header>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {currentUser && (
        <Form 
          onSubmit={onSubmit} 
          currentUser={currentUser} 
          maxLength={1000}
          disabled={isLoading}
        />
      )}

      {isLoading ? (
        <p>Updating status...</p>
      ) : status ? (
        <>
          <p>Your current status:</p>
          <p>
            <code>{status}</code>
          </p>
        </>
      ) : (
        <p>No status message yet!</p>
      )}
    </main>
  );
};

App.propTypes = {
  contract: PropTypes.shape({
    set_status: PropTypes.func.isRequired,
    get_status: PropTypes.func.isRequired,
  }).isRequired,
  currentUser: PropTypes.shape({
    accountId: PropTypes.string.isRequired,
    balance: PropTypes.string.isRequired,
  }),
  nearConfig: PropTypes.shape({
    contractName: PropTypes.string.isRequired,
  }).isRequired,
  wallet: PropTypes.shape({
    requestSignIn: PropTypes.func.isRequired,
    signOut: PropTypes.func.isRequired,
  }).isRequired,
};

export default App;
