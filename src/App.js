import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [user, setUser] = useState();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get("code");

    if (code) {
      fetch("http://localhost:3000/api/oauth/token", {
        method: "POST",
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `client_id=26990216-e340-4f54-b5a5-df9baacc0440&redirect_uri=http://localhost:3001&grant_type=authorization_code&code=${code}`
      }).then(response => response.json())
        .then((body) => {
          const { access_token: accessToken, token_type: tokenType } = body;
          return fetch("http://localhost:3000/api/user", {
            headers: {
              Authorization: `${tokenType} ${accessToken}`
            }
          })
        })
        .then(response => response.json())
        .then(setUser)
    }
  }, []);

  return (
    <div className="App">
      <h1>PKCE Demo</h1>
      {user && user.firstName ?
        <strong>{`Hey ${user.firstName}`}</strong>
        : (<a
          className="App-link"
          href="http://localhost:3000/api/oauth/authorize?client_id=26990216-e340-4f54-b5a5-df9baacc0440&redirect_uri=http://localhost:3001&grant_type=authorization_code&scope=users&response_type=code&state=xxxx"
        >
          Login to Kontist
        </a>)}
    </div>
  );
}

export default App;
