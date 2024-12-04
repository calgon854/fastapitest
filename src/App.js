import React, { useState, useEffect } from "react";
import {
  Button,
  Container,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import axios from "axios";
import Papa from "papaparse";
import logo from "./1.gif";
import "./App.css";

function App() {
  const defaultValues = {
    "wgs84-to-lv95": {
      longitude: 7.43863242087181,
      latitude: 46.95108277187109,
    },
    "lv95-to-wgs84": {
      longitude: 2600667.4752589185,
      latitude: 1199657.3163924862,
    },
  };

  const [longitude, setLongitude] = useState(
    defaultValues["wgs84-to-lv95"].longitude
  );
  const [latitude, setLatitude] = useState(
    defaultValues["wgs84-to-lv95"].latitude
  );
  const [result, setResult] = useState("");
  const [transformationType, setTransformationType] = useState("wgs84-to-lv95");

  //csv
  const [csvData, setCsvData] = useState([]);
  const [file, setFile] = useState(null);

  const handleTransformation = async () => {
    try {
      const url =
        transformationType === "wgs84-to-lv95"
          ? `http://127.0.0.1:8000/wgs84lv95?lng=${longitude}&lat=${latitude}`
          : `http://127.0.0.1:8000/lv95wgs84?e=${longitude}&n=${latitude}`;

      const response = await axios.get(url);
      setResult(response.data);
    } catch (error) {
      console.error("Fehler beim Abrufen der Daten:", error);

      setResult(
        "Fehler bei der Anfrage. Bitte überprüfen Sie die Eingaben und den Server."
      );
    }
  };

  const setDefaultValues = (type) => {
    const values = defaultValues[type];
    if (values) {
      setLongitude(values.longitude);
      setLatitude(values.latitude);
    }
  };

  // Effekt zur Aktualisierung der Eingabewerte, wenn sich der Transformationstyp ändert
  useEffect(() => {
    setDefaultValues(transformationType);
  }, [transformationType]);

  // Funktion zum Parsen und Hochladen der CSV-Datei
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFile(file);
      Papa.parse(file, {
        complete: (result) => {
          console.log("CSV-Parsing-Ergebnis:", result.data);
          setCsvData(result.data);
        },
        header: true, // Wenn die CSV-Datei eine Kopfzeile hat
        skipEmptyLines: true,
      });
    }
  };

  const handleCsvTransformation = async () => {
    try {
      if (csvData.length > 0) {
        const directionMap = {
          "wgs84-to-lv95": "wgs84ToLv95",
          "lv95-to-wgs84": "lv95ToWgs84",
        };

        const direction = directionMap[transformationType];
        const url = `http://127.0.0.1:8000/transform-csv?direction=${direction}`;
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios.post(url, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: "blob",
        });

        if (response.status === 200) {
          const blob = new Blob([response.data], {
            type: "text/csv;charset=utf-8",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "transformed_coordinates.csv";
          a.click();
          URL.revokeObjectURL(url);
        } else {
          console.error("Fehler beim Transformieren der CSV:", response.data);
        }
      }
    } catch (error) {
      console.error("Fehler bei der CSV-Transformation:", error);
    }
  };

  const renderResult = () => {
    if (typeof result === "string") {
      return <Typography color="error">{result}</Typography>;
    }

    if (
      transformationType === "wgs84-to-lv95" &&
      result &&
      result.e_lv95 !== undefined &&
      result.n_lv95 !== undefined
    ) {
      return (
        <Typography>
          Ergebnis: Ost (Easting): {result.e_lv95.toFixed(2)}, Nord (Northing):{" "}
          {result.n_lv95.toFixed(2)}
        </Typography>
      );
    }

    if (
      transformationType === "lv95-to-wgs84" &&
      result &&
      result.lng !== undefined &&
      result.lat !== undefined
    ) {
      return (
        <Typography>
          Ergebnis: Longitude: {result.lng.toFixed(6)}, Latitude:{" "}
          {result.lat.toFixed(6)}
        </Typography>
      );
    }
  };

  return (
    <>
      <img src={logo} className="App-logo"></img>
      <Container>
        <Typography variant="h4">Koordinatentransformation</Typography>

        {/* Dropdown-Menü zur Auswahl der Transformationsrichtung */}
        <FormControl fullWidth margin="normal">
          <InputLabel id="transformation-select">Transformation</InputLabel>
          <Select
            labelId="transformation-select"
            value={transformationType}
            onChange={(e) => setTransformationType(e.target.value)}
            fullWidth
          >
            <MenuItem value="wgs84-to-lv95">WGS84 → LV95</MenuItem>
            <MenuItem value="lv95-to-wgs84">LV95 → WGS84</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label={
            transformationType === "wgs84-to-lv95" ? "Longitude" : "Easting"
          }
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          type="number"
          fullWidth
          margin="normal"
        />
        <TextField
          label={
            transformationType === "lv95-to-wgs84" ? "Northing" : "Latitude"
          }
          value={latitude}
          onChange={(n) => setLatitude(n.target.value)}
          type="number"
          fullWidth
          margin="normal"
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleTransformation}
          fullWidth
        >
          Transformiere
        </Button>

        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          style={{ marginTop: 20 }}
        />
        <Button
          variant="contained"
          color="secondary"
          onClick={handleCsvTransformation}
          fullWidth
          disabled={!file}
          style={{ marginTop: 10 }}
        >
          CSV transformieren und exportieren
        </Button>

        {renderResult()}
      </Container>
    </>
  );
}

export default App;
