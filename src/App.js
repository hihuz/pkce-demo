import React, { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [user, setUser] = useState();
  const [token, setToken] = useState();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");

    if (code) {
      window.history.replaceState(
        null,
        document.title,
        window.location.pathname
      );
      getAccessTokenAndFetchUser(code);
    }
  }, []);

  const refreshAccessTokenViaIframe = () => {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    iframe.src =
      "http://localhost:3000/api/oauth/authorize?client_id=26990216-e340-4f54-b5a5-df9baacc0440&redirect_uri=http://localhost:3001&grant_type=authorization_code&scope=users&response_type=code&response_mode=web_message&state=xxxx&&code_challenge=xc3uY4-XMuobNWXzzfEqbYx3rUYBH69_zu4EFQIJH8w&code_challenge_method=S256&prompt=none";
  };

  useEffect(() => {
    const onMessage = event => {
      if (event.origin === "http://localhost:3000") {
        console.log("message", event.data);
        if (!event.data.error) {
          const { code } = event.data.response;
          getAccessTokenAndFetchUser(code);
        }
      }
    };

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  function getAccessTokenAndFetchUser(code) {
    fetch("http://localhost:3000/api/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `client_id=26990216-e340-4f54-b5a5-df9baacc0440&redirect_uri=http://localhost:3001&grant_type=authorization_code&code=${code}&code_verifier=Huag6ykQU7SaEYKtmNUeM8txt4HzEIfG`
    })
      .then(response => response.json())
      .then(body => {
        const { access_token: accessToken } = body;
        setToken(accessToken);
        return fetch("http://localhost:3000/api/user", {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
      })
      .then(response => response.json())
      .then(setUser);
  }

  return (
    <div className="App">
      <h1>PKCE Demo</h1>
      {user && user.firstName ? (
        <strong>{`Hey ${user.firstName}`}</strong>
      ) : (
        <a
          className="App-link"
          href="http://localhost:3000/api/oauth/authorize?client_id=26990216-e340-4f54-b5a5-df9baacc0440&redirect_uri=http://localhost:3001&grant_type=authorization_code&scope=users+offline&response_type=code&state=xxxx&code_challenge=xc3uY4-XMuobNWXzzfEqbYx3rUYBH69_zu4EFQIJH8w&code_challenge_method=S256"
        >
          Login to Kontist
        </a>
      )}
      <div>
        <a
          className="App-link"
          href="http://localhost:3000/api/oauth/authorize?client_id=26990216-e340-4f54-b5a5-df9baacc0440&redirect_uri=http://localhost:3001&grant_type=authorization_code&scope=users&response_type=code&state=xxxx&&code_challenge=xc3uY4-XMuobNWXzzfEqbYx3rUYBH69_zu4EFQIJH8w&code_challenge_method=S256&prompt=none"
        >
          Renew token
        </a>
      </div>
      <button onClick={refreshAccessTokenViaIframe}>Use iframe</button>
      {token && <div style={{ wordBreak: "break-all" }}>{token}</div>}
    </div>
  );
}

export default App;
