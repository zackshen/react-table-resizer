import React, { useState } from "react";
import ReactDOM from "react-dom";
import { LocationProvider, Match, Link } from "react-location";
import styled from "styled-components";

import "./styles.css";

import { Select } from "./components/Styles";

import Basic from "./examples/Basic";
import ServerSideData from "./examples/ServerSideData";

const Button = styled.button`
  font-size: 1rem;
  display: inline-block;
  padding: 0.5rem;
  margin: 0.3rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 0.2rem;
  border: 0;
`;

const useLocalStorage = (key, initial) => {
  let local;
  try {
    local = JSON.parse(localStorage.getItem(key));
  } catch (err) {
    //
  }
  if (!local) {
    localStorage.setItem(key, JSON.stringify(initial));
    local = initial;
  }
  const [state, _setState] = useState(local);
  const setState = updater => {
    _setState(old => {
      let res;
      if (typeof updater === "function") {
        res = updater(old);
      } else {
        res = updater;
      }
      localStorage.setItem(key, JSON.stringify(res));
      return res;
    });
  };
  return [state, setState];
};

function App() {
  const [infinite, setInfinite] = useLocalStorage("infiniteScrolling", false);
  return (
    <LocationProvider>
      <div className="App">
        <h1>React-Table v7 Sandbox</h1>
        <p>
          Version 7 of React-Table is a fully rewritten, headless component. It
          provides the same functionality as previous versions, and also some
          new features not previously possible. At its core, it's headless
          nature means that React-Table doesn't render any anything and only
          provides you the necessary state and api to build, render, and manage
          your table. You as the developer are responsible for all components,
          styles, and display composition.
        </p>
        <div>
          <Button as={Link} to="/">
            Basic
          </Button>
          <Button as={Link} to="server-side-data">
            Server-Side Data
          </Button>
        </div>
        <div>
          <Button onClick={() => setInfinite(old => !old)}>
            Toggle {infinite ? "Pagination" : "Infinite Scrolling"}
          </Button>
        </div>
        <div>
          <Select>
            {[10, 100, 1000, 10000, 100000, 500000, 1000000].map(size => (
              <option key={size} value={size}>
                {size} Rows
              </option>
            ))}
          </Select>
        </div>
        <Match path="/" component={Basic} infinite={infinite} />
        <Match
          path="server-side-data"
          component={ServerSideData}
          infinite={infinite}
        />
      </div>
    </LocationProvider>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
