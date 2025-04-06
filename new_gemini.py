# import google.generativeai as genai
from google import genai
from dotenv import load_dotenv
import os

# Initialize your API key with the new initialization method
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Authenticate with your API key
client = genai.Client(api_key=GEMINI_API_KEY)
chat = client.chats.create(model='gemini-2.0-flash')


# Sample JSON data received from your Gemini API
emotion_data = {
    "transcript": "I’ve been feeling off lately, like nothing makes sense.",
    "dominant_emotion": "sad",
    "emotion_over_time": [
        {"time": 1.2, "emotion": "sad"},
        {"time": 3.4, "emotion": "neutral"}
    ]
}

# Define the system prompt to set the therapist-like persona
system_instruction = (
    "You are a compassionate therapist. Read the user's transcript and emotional tone. "
    "Understand what they might be going through and respond empathetically. "
    "Address the dominant emotion and offer supportive insights."
)

# Build the user prompt using the JSON data
user_prompt = (
    f"Transcript: {emotion_data['transcript']}\n"
    f"Dominant Emotion: {emotion_data['dominant_emotion']}\n\n"
    "How would you respond?"
)

# Prepare the list of messages according to the new chat completion method
messages = [
    {"role": "system", "content": system_instruction},
    {"role": "user", "content": user_prompt}
]
def messages_to_string(messages):
    return "\n\n".join(
        f"{message['role'].capitalize()}:\n{message['content']}" for message in messages
    )

# Usage
full_prompt = messages_to_string(messages)

response = chat.send_message(
    message=full_prompt)

# Output the AI's empathetic response (accessing the first choice)
print(response.text)