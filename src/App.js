import logo from "./1.gif";
import React, { useState } from "react";
import { Button, Container, TextField, Typography } from "@mui/material";
import "./App.css";
import axios from "axios";

function App() {
  const [a, setA] = useState("5");
  const [b, setB] = useState("3");
  const [result, setResult] = useState("");
  // const [resultat, setResultat] = useState("");

  const add_old = () => {
    setResult(Number(a) + Number(b));
  };

  const add = async () => {
    const antwort = await axios.get("http://127.0.0.1:8000/add", {
      params: { a: parseInt(a), b: parseInt(b) },
    });

    setResult(antwort.data.resultat);
  };

  return (
    <>
      <Container>
        <img src={logo} className="App-logo" alt="logo" />
        <TextField
          label="erste Zahl"
          value={a}
          onChange={(e) => setA(e.target.value)}
          type="number"
          fullWidth
        />
        <TextField
          label="zweite Zahl"
          value={b}
          onChange={(e) => setB(e.target.value)}
          type="number"
          fullWidth
        />
        <Button variant="contained" color="primary" onClick={add}>
          addiere!!!
        </Button>
        <br />
        <br /> {result}
      </Container>
    </>
  );
}

export default App;
