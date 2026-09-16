from fastapi import FastAPI, UploadFile, File
import os
import uuid

app = FastAPI()

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.get("/")
def home():
    return {
        "message": "Welcome to AuraNote API!"
    }


@app.post("/upload")
async def upload_meeting(file: UploadFile = File(...)):

    meeting_id = str(uuid.uuid4())

    file_extension = os.path.splitext(file.filename)[1]

    filename = meeting_id + file_extension

    file_path = os.path.join(UPLOAD_FOLDER, filename)

    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    return {
        "message": "Meeting uploaded successfully!",
        "meeting_id": meeting_id,
        "filename": file.filename
    }