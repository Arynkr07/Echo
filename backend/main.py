from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.meeting import router as meeting_router
from routes.question import router as question_router


app = FastAPI(
    title="Echo AI Meeting Assistant",
    description="Backend for the AI-powered meeting assistant",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meeting_router)
app.include_router(question_router)


@app.get("/")
def root():
    return {"message": "Echo AI Meeting Assistant Backend is running"}


@app.get("/health")
def health():
    return {"status": "ok"}