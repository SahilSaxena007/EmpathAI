import asyncio
import json
import websockets

async def handler(websocket):
    print("Client connected")
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                print("Received:", data)
                if data.get("type") in ("transcript", "emotion"):
                    response = f"Therapist: I understand you are feeling {data['data']}. Tell me more about that."
                    await websocket.send(json.dumps({"type": "response", "data": response}))
            except Exception as e:
                print("Error parsing message:", e)
    except websockets.ConnectionClosed:
        print("Client disconnected")

async def main():
    async with websockets.serve(handler, "localhost", 3000):
        print("WebSocket server is running on ws://localhost:3000")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
