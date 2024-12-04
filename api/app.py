from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pyproj import Transformer
import pandas as pd
from io import StringIO

app = FastAPI()
app.add_middleware(CORSMiddleware,
                   allow_origins=["*"],
                   allow_credentials=True,
                   allow_methods=["*"],
                   allow_headers=["*"])

wgs84_to_lv95 = Transformer.from_crs("EPSG:4326", "EPSG:2056", always_xy=True)
lv95_to_wgs84 = Transformer.from_crs("EPSG:2056", "EPSG:4326", always_xy=True)


@app.get("/wgs84lv95")
async def transform_to_lv95(lng: float, lat: float):
    try:
        e, n = wgs84_to_lv95.transform(lng, lat)
        return {"e_lv95": e, "n_lv95": n}
    except Exception as e:
        return {"error": f"Transformation failed: {str(e)}"}

@app.get("/lv95wgs84")
async def transform_to_wgs84(e: float, n: float):
    try:
        lng, lat = lv95_to_wgs84.transform(e, n)
        return {"lng": lng, "lat": lat}
    except Exception as e:
        return {"error": f"Transformation failed: {str(e)}"}

# csv
# nicht ideal, da fehler in output und es wird trotzdem geschrieben ... zu hoher zeitaufwand
@app.post("/transform-csv")
async def transform_csv(file: UploadFile = File(...), direction: str = "wgs84ToLv95"):
    content = await file.read()
    df = pd.read_csv(StringIO(content.decode('utf-8')))

    if direction == "wgs84ToLv95":
        if "Latitude" not in df.columns or "Longitude" not in df.columns:
            return {"error": "Die CSV-Datei muss die Spalten 'Latitude' und 'Longitude' enthalten."}

        e, n = wgs84_to_lv95.transform(df["Longitude"].astype(float).values, df["Latitude"].astype(float).values)
        df["Longitude"] = e
        df["Latitude"] = n
        df.rename(columns={"Longitude": "Easting", "Latitude": "Northing"}, inplace=True)

    elif direction == "lv95ToWgs84":
        if "Easting" not in df.columns or "Northing" not in df.columns:
            return {"error": "Die CSV-Datei muss die Spalten 'Easting' und 'Northing' enthalten."}

        lng, lat = lv95_to_wgs84.transform(df["Easting"].astype(float).values, df["Northing"].astype(float).values)
        df["Easting"] = lng
        df["Northing"] = lat
        df.rename(columns={"Easting": "Longitude", "Northing": "Latitude"}, inplace=True)

    else:
        return {"error": "Ungültige Transformationsrichtung"}

    output = StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transformed_coordinates.csv"}
    )