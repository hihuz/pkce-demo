import React, { useEffect, useState } from "react";
import { Client } from "@kontist/client";
import config from "./config";
import "./App.css";

const { baseAPIUrl, clientId, redirectUri } = config;

const kontistClient = new Client({
  baseUrl: baseAPIUrl,
  clientId,
  redirectUri,
  scopes: ["users"],
  state: "some?state&with#uri=components",
  verifier: "some-random-verifier"
});

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

  const fetchUser = async () => {
    const { viewer } = await kontistClient.graphQL.rawQuery(`
      {
        viewer {
          firstName
        }
      }
    `);
    setUser(viewer);
  };

  function cancelLoginConfirmation() {
    kontistClient.auth.push.cancelConfirmation();
  }

  return (
    <div className="App">
      <h1>PKCE Demo</h1>
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
        <button onClick={fetchUser}>fetch transfers</button>
      </div>
      {token && <div style={{ wordBreak: "break-all" }}>{token}</div>}
    </div>
  );
}

export default App;
