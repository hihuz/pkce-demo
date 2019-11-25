import React, { useEffect, useState } from "react";
import { Client } from "kontist";
import config from "./config";
import "./App.css";

const { baseAPIUrl, clientId, redirectUri } = config;

const kontistClient = new Client({
  baseUrl: baseAPIUrl,
  baseSubscriptionUrl: "ws://localhost:3000",
  clientId,
  redirectUri,
  scopes: ["users"],
  state: "some?state&with#uri=components",
  verifier: "some-random-verifier"
});

let unsubscribeHandler;
let unsubscribeHandler2;

const handleNewTransaction = data => {
  console.log("___data #1___", data);
};

const handleNewTransaction2 = data => {
  console.log("___data #2___", data);
};

function App() {
  const [user, setUser] = useState();
  const [token, setToken] = useState();

  useEffect(() => {
    const authenticateAndFetchUser = async () => {
      const token = await kontistClient.auth.fetchToken(document.location.href);
      setToken(token.accessToken);
      try {
        const { viewer } = await kontistClient.graphQL.rawQuery(`
        {
          viewer {
            firstName
          }
        }
      `);
        setUser(viewer);
      } catch (error) {
        console.log({ error });
      }
    };
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");

    if (code) {
      authenticateAndFetchUser();
    }
  }, []);

  const refreshAccessTokenViaIframe = async () => {
    const token = await kontistClient.auth.tokenManager.refresh();
    setToken(token.accessToken);
    await kontistClient.graphQL.rawQuery(`
    {
      viewer {
        firstName
      }
    }
  `);
  };

  async function login() {
    const url = await kontistClient.auth.getAuthUri();
    window.location.href = url;
  }

  async function triggerLoginConfirmation() {
    try {
      const confirmedToken = await kontistClient.auth.push.getConfirmedToken();
      setToken(confirmedToken);
    } catch (err) {
      console.log({ err });
    }
  }

  function cancelLoginConfirmation() {
    kontistClient.auth.push.cancelConfirmation();
  }

  const subscribeToTransactions = () => {
    const unsubscribe = kontistClient.models.transaction.subscribe(
      handleNewTransaction
    );
    unsubscribeHandler = unsubscribe;
  };

  const unsubscribeToTransactions = () => {
    console.log("___will unsubscribe #1___");
    unsubscribeHandler();
  };

  const subscribeToTransactions2 = () => {
    const unsubscribe = kontistClient.models.transaction.subscribe(
      handleNewTransaction2
    );
    unsubscribeHandler2 = unsubscribe;
  };

  const unsubscribeToTransactions2 = () => {
    console.log("___will unsubscribe #2___");
    unsubscribeHandler2();
  };
  return (
    <div className="App">
      <h1>SDK Sandbox</h1>
      <div>
        {user && user.firstName ? (
          <strong>{`Hey ${user.firstName}`}</strong>
        ) : (
          <button onClick={login}>Login to Kontist</button>
        )}
      </div>
      <div>
        <button onClick={refreshAccessTokenViaIframe}>
          Refresh token with iframe
        </button>
      </div>
      <div>
        <button onClick={triggerLoginConfirmation}>
          trigger login confirmation
        </button>
      </div>
      <div>
        <button onClick={cancelLoginConfirmation}>
          cancel login confirmation
        </button>
      </div>
      <div>
        <button onClick={subscribeToTransactions}>
          subscribe to transactions #1
        </button>
      </div>
      <div>
        <button onClick={unsubscribeToTransactions}>
          unsubscribe to transactions #1
        </button>
      </div>
      <div>
        <button onClick={subscribeToTransactions2}>
          subscribe to transactions #2
        </button>
      </div>
      <div>
        <button onClick={unsubscribeToTransactions2}>
          unubscribe to transactions #2
        </button>
      </div>
      {token && <div style={{ wordBreak: "break-all" }}>{token}</div>}
    </div>
  );
}

export default App;
