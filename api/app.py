from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(CORSMiddleware,
                allow_origins=["*"],
                allow_credentials=True,
                allow_methods=["*"],
                allow_headers=["*"])

@app.get("/add")
async def add(a: int, b: int):
    return {"resultat": a+b,
            "copyright": "(c) 2024 FHNW"}