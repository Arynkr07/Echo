from fastapi import FastAPI

app = FastAPI(title="Echo Meeting Assistant")


@app.get("/")
def root():
    return {
        "message": "Echo Backend is running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }