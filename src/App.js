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
  scopes: ["accounts offline"],
  state: "some?state&with#uri=components",
  //verifier: "some-random-verifier"
  clientSecret: "kontist1"
});

let unsubscribeHandler;
let unsubscribeHandler2;

const handleNewTransaction = data => {
  console.log("___data #1___", data);
};

const handleErrors = error => {
  console.log("___error #1___", error);
};

const handleNewTransaction2 = data => {
  console.log("___data #2___", data);
};

function App() {
  const [user, setUser] = useState();
  const [token, setToken] = useState("");
  const [cardId, setCardId] = useState("");
  const [pin, setPin] = useState("");
  const [authorizationToken, setAuthorizationToken] = useState("");
  const [confirmationId, setConfirmationId] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [action, setAction] = useState("");

  useEffect(() => {
    const authenticateAndFetchUser = async () => {
      const token = await kontistClient.auth.fetchToken(document.location.href);
      console.log("___regular token___", token);
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
    let token;
    token = await kontistClient.auth.refresh();
    console.log("___token was refreshed___", token);
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
      console.log("___confirmedToken___", confirmedToken);
      setToken(confirmedToken.accessToken);
    } catch (err) {
      console.log({ err });
    }
  }

  function cancelLoginConfirmation() {
    kontistClient.auth.push.cancelConfirmation();
  }

  const subscribeToTransactions = () => {
    const { unsubscribe } = kontistClient.models.transaction.subscribe(
      handleNewTransaction,
      handleErrors
    );
    unsubscribeHandler = unsubscribe;
  };

  const unsubscribeToTransactions = () => {
    console.log("___will unsubscribe #1___");
    unsubscribeHandler();
  };

  const subscribeToTransactions2 = () => {
    const { unsubscribe } = kontistClient.models.transaction.subscribe(
      handleNewTransaction2
    );
    unsubscribeHandler2 = unsubscribe;
  };

  const unsubscribeToTransactions2 = () => {
    console.log("___will unsubscribe #2___");
    unsubscribeHandler2();
  };

  const createTransfers = async () => {
    await kontistClient.models.transfer.createMany(
      [...Array(20).keys()].map(amount => ({
        amount: amount + 1,
        recipient: "Santa Claus",
        iban: "DE18512308000000060339",
        purpose: `transfer ${amount}`
      }))
    );
  };

  const fetchTransactions = async () => {
    const transactions = await kontistClient.models.transaction.fetch({
      first: 3
    });

    console.log("___transactions___", transactions);

    const { endCursor } = transactions.pageInfo;

    const otherTransactions = await kontistClient.models.transaction.fetch({
      first: 3,
      after: endCursor
    });

    console.log("___other transactions___", otherTransactions);
  };

  const fetchAllTransactions = async () => {
    let transactions = [];
    for await (const transaction of kontistClient.models.transaction.fetchAll()) {
      transactions = transactions.concat(transaction);
    }

    console.log(
      "___received transactions___",
      transactions.map(transaction => transaction.bookingDate)
    );
  };

  const fetchTransfers = async () => {
    const transfers = await kontistClient.models.transfer.fetch({
      last: 3,
      type: "SEPA_TRANSFER"
    });

    console.log("___transfers___", transfers);

    const otherTransfers = await transfers.previousPage();

    console.log("___other transfers", otherTransfers);
  };

  const fetchAllTransfers = async () => {
    let transfers = [];
    for await (const transfer of kontistClient.models.transfer.fetchAll({
      type: "SEPA_TRANSFER",
      where: { status: "CONFIRMED" }
    })) {
      transfers = transfers.concat(transfer);
    }

    console.log(
      "___end transfers___",
      transfers.map(transfer => transfer.status)
    );
  };

  const getCards = async () => {
    const cards = await kontistClient.models.card.fetch();
    console.log("___cards___", cards);
  };

  const handleCardIdChange = event => {
    setCardId(event.target.value);
  };

  const handlePinChange = event => {
    setPin(event.target.value);
  };

  const handleAuthorizationTokenChange = event => {
    setAuthorizationToken(event.target.value);
  };

  const handleVerificationTokenChange = event => {
    setVerificationToken(event.target.value);
  };

  const handleActionChange = event => {
    setAction(event.target.value);
  };

  const getCard = async () => {
    const card = await kontistClient.models.card.get({
      id: cardId
    });
    console.log("___card___", card);
  };

  const activateCard = async () => {
    const card = await kontistClient.models.card.activate({
      id: cardId,
      verificationToken
    });
    console.log("___card___", card);
  };

  const changePin = async () => {
    const confirmationId = await kontistClient.models.card.changePIN({
      id: cardId,
      pin
    });

    console.log("___confirmationId___", confirmationId);

    setConfirmationId(confirmationId);
  };

  const confirmChangePin = async () => {
    const status = await kontistClient.models.card.confirmChangePIN({
      id: cardId,
      confirmationId,
      authorizationToken
    });

    console.log("___status___", status);
  };

  const changeCardStatus = async () => {
    const card = await kontistClient.models.card.changeStatus({
      id: cardId,
      action
    });

    console.log("___card___", card);
  };

  const createCard = async () => {
    const card = await kontistClient.models.card.create({
      type: "VISA_BUSINESS_DEBIT"
    });

    console.log("___card___", card);
  };

  const updateCardSettings = async () => {
    const settings = await kontistClient.models.card.updateSettings({
      id: cardId,
      contactlessEnabled: false,
      cardNotPresentLimits: {
        daily: {
          maxAmountCents: 350000,
          maxTransactions: 19
        },
        monthly: {
          maxAmountCents: 2000000,
          maxTransactions: 619
        }
      },
      cardPresentLimits: {
        daily: {
          maxAmountCents: 440000,
          maxTransactions: 14
        },
        monthly: {
          maxAmountCents: 2600000,
          maxTransactions: 468
        }
      }
    });

    console.log("___settings___", settings);
  };

  const getCardLimits = async () => {
    const limits = await kontistClient.models.card.getLimits({
      id: cardId
    });

    console.log("___limits___", limits);
  };

  const categorizeTransaction = async () => {
    const transaction = await kontistClient.models.transaction.categorize({
      id: "9e5b4c9e-07a7-4fad-80fd-aec2ce191768",
      category: "VAT_PAYMENT",
      userSelectedBookingDate: new Date().toISOString()
    });

    console.log("___categorized___", transaction);
  };

  const getTransferSuggestions = async () => {
    const suggestions = await kontistClient.models.transfer.suggestions();

    console.log("___suggestions___", suggestions);
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
      <div>
        <button onClick={createTransfers}>create transfers</button>
      </div>
      <div>
        <button onClick={fetchTransactions}>fetch transactions</button>
      </div>
      <div>
        <button onClick={fetchAllTransactions}>fetch all transactions</button>
      </div>
      <div>
        <button onClick={fetchTransfers}>fetch transfers</button>
      </div>
      <div>
        <button onClick={fetchAllTransfers}>fetch all transfers</button>
      </div>
      <div>
        <button onClick={getCards}>fetch all cards</button>
      </div>
      <div>
        card id:
        <input id="card-id" value={cardId} onChange={handleCardIdChange} />
      </div>
      <div>
        <button onClick={getCard}>fetch card</button>
      </div>
      <div>
        verificationToken:{" "}
        <input
          id="verification-token"
          value={verificationToken}
          onChange={handleVerificationTokenChange}
        />
        <button onClick={activateCard}>activate card</button>
      </div>
      <div>
        pin: <input id="pin" value={pin} onChange={handlePinChange} />
        <button onClick={changePin}>change pin</button>
      </div>
      <div>
        confirmationId: <input id="pin" value={confirmationId} disabled />
        token:{" "}
        <input
          id="authorization-token"
          value={authorizationToken}
          onChange={handleAuthorizationTokenChange}
        />
        <button onClick={confirmChangePin}>confirm change pin</button>
      </div>
      <div>
        action:{" "}
        <input id="action" value={action} onChange={handleActionChange} />
        <button onClick={changeCardStatus}>change card status</button>
      </div>
      <div>
        <button onClick={createCard}>create card</button>
      </div>
      <div>
        <button onClick={updateCardSettings}>update settings</button>
      </div>
      <div>
        <button onClick={getCardLimits}>get card limits</button>
      </div>
      <div>
        <button onClick={categorizeTransaction}>categorize transaction</button>
      </div>
      <div>
        <button onClick={getTransferSuggestions}>
          get transfer suggestions
        </button>
      </div>
      {token && <div style={{ wordBreak: "break-all" }}>{token}</div>}
    </div>
  );
}

export default App;
