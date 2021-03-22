import logo from "./logo.svg";
import "./App.css";
import React, { useEffect } from "react";

function App() {
  const requestPred = () => {
    fetch("/api/getPrediction", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      mode: "cors",
      body: JSON.stringify({
        data: [
          [
            7.7,
            -0.7209543945551808,
            73.0,
            -0.7397394301164261,
            -1.1370056192812146,
            -1.1370056192812146,
          ],
          [
            7.8,
            -0.8053251308694391,
            71.0,
            -0.7394977950119094,
            -1.2474091338637148,
            -1.2474091338637148,
          ],
          [
            7.9,
            -0.9314003493924903,
            69.0,
            -0.739014373092974,
            -1.2124355652982142,
            -1.2124355652982142,
          ],
          [
            7.9,
            -0.970977952133921,
            68.0,
            -0.7387724521688765,
            -1.0902717383290514,
            -1.0902717383290514,
          ],
          [
            7.8,
            -0.9938969464149257,
            67.0,
            -0.7385305703469175,
            -1.299038105676658,
            -1.299038105676658,
          ],
          [
            7.8,
            -0.9997897261573482,
            66.0,
            -0.738288459049906,
            -1.4868535021369726,
            -1.4868535021369726,
          ],
          [
            7.8,
            -0.9603545292431099,
            65.0,
            -0.7378040854778138,
            -2.3403318451813457,
            -2.3403318451813457,
          ],
          [
            7.7,
            -0.9156918213859283,
            67.0,
            -0.7375616888289724,
            -2.3037489589799214,
            -2.3037489589799214,
          ],
          [
            7.7,
            -0.855326585915333,
            68.0,
            -0.7373191971078112,
            -2.339599698690593,
            -2.339599698690593,
          ],
          [
            8.2,
            -0.7802939819877772,
            65.0,
            -0.7370766103454726,
            -2.544144288469278,
            -2.544144288469278,
          ],
          [
            8.7,
            -0.6919331930501572,
            62.0,
            -0.7368340632731473,
            -2.5376618037026195,
            -2.5376618037026195,
          ],
          [
            9.0,
            -0.5916614699081681,
            60.0,
            -0.7365912865750501,
            -2.09908729713455,
            -2.09908729713455,
          ],
          [
            9.3,
            -0.48124377805220214,
            58.0,
            -0.7363484149296423,
            -1.8238826596210918,
            -1.8238826596210918,
          ],
          [
            10.0,
            -0.36264136224338017,
            55.0,
            -0.7361055832261659,
            -2.3160429791371495,
            -2.3160429791371495,
          ],
          [
            10.5,
            -0.23775652970481262,
            52.0,
            -0.7358625218327145,
            -2.566012572757425,
            -2.566012572757425,
          ],
        ],
      }),
    })
      .then((response) => response.json())
      .then((response) => {
        console.log(response);
      })
      .catch((err) => console.log(err));
  };
  useEffect(() => requestPred(), []);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
