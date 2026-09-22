from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.meeting import router as meeting_router
from routes.question import router as question_router
from websocket import router as websocket_router


app = FastAPI(
    title="Echo AI Meeting Assistant",
    description="Backend for the AI-powered meeting assistant",
    version="1.0.0"
)


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# REST API routes
app.include_router(meeting_router)
app.include_router(question_router)


# WebSocket route
app.include_router(websocket_router)


@app.get("/")
def root():
    return {
        "message": "Echo AI Meeting Assistant Backend is running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }