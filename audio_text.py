import pyaudio
import wave
import os
import time
from deepgram import DeepgramClient, PrerecordedOptions, FileSource
import asyncio
from dotenv import load_dotenv


load_dotenv()  # Load environment variables from .env file
# Deepgram API Key - replace with your API key
DEEPGRAM_API_KEY = os.getenv("API_KEY")

# Audio recording parameters
CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
RECORD_SECONDS = 5
WAVE_OUTPUT_FILENAME = "user_audio.mp3"

def record_audio():
    """
    Record audio from the microphone and save it to a WAV file
    Returns the path to the saved audio file
    """
    p = pyaudio.PyAudio()

    print("Recording will start in 3 seconds...")
    for i in range(3, 0, -1):
        print(f"{i}...")
        time.sleep(1)
    
    print("Recording...")
    
    stream = p.open(format=FORMAT,
                    channels=CHANNELS,
                    rate=RATE,
                    input=True,
                    frames_per_buffer=CHUNK)

    frames = []

    for i in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
        data = stream.read(CHUNK)
        frames.append(data)

    print("Recording finished.")

    stream.stop_stream()
    stream.close()
    p.terminate()

    wf = wave.open(WAVE_OUTPUT_FILENAME, 'wb')
    wf.setnchannels(CHANNELS)
    wf.setsampwidth(p.get_sample_size(FORMAT))
    wf.setframerate(RATE)
    wf.writeframes(b''.join(frames))
    wf.close()

    return WAVE_OUTPUT_FILENAME

async def transcribe_audio(audio_file_path):
    """
    Transcribe the audio file using Deepgram API v3
    Returns the transcribed text
    """
    try:
        # Initialize the Deepgram client with simple approach
        deepgram = DeepgramClient(DEEPGRAM_API_KEY)
        
        # Use the from_file method directly with the file path
        with open(audio_file_path, 'rb') as audio:
            # payload = audio.read()
            buffer_data = audio.read()
            payload: FileSource = {
            "buffer": buffer_data,
        }
            
            #STEP 2: Configure Deepgram options for audio analysis
            options = PrerecordedOptions(
                model="nova-3",
                smart_format=True,
            )
            response = deepgram.listen.rest.v("1").transcribe_file(payload, options)
        
    
    # STEP 4: Print the response
        print(response.to_json(indent=4))
    except Exception as e:
        print(f"Exception: {e}")

async def main():
    """
    Main function to record audio and transcribe it
    """
    try:
        # Step 1: Record audio from the user
        audio_file = record_audio()
        
        # Step 2: Transcribe the audio
        print("Transcribing audio...")
        transcript = await transcribe_audio(audio_file)
        
        # Step 3: Display the transcription
        print("\nTranscription result:")
        print(transcript)
        
        # Optional: Clean up the audio file
        # os.remove(audio_file)
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Setup for Windows users
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
    # Run the main function
    asyncio.run(main())