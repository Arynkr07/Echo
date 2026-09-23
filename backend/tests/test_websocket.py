import asyncio
import websockets


async def test():

    meeting_id = "test-meeting-123"

    uri = f"ws://127.0.0.1:8000/ws/meeting/{meeting_id}"

    async with websockets.connect(uri) as websocket:

        print("Connected to backend")

        # Test text message
        await websocket.send("Hello from backend test")

        response = await websocket.recv()

        print("Server:", response)

        # Fake audio data
        fake_audio = b"1234567890"

        await websocket.send(fake_audio)

        response = await websocket.recv()

        print("Server:", response)


asyncio.run(test())