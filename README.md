# EmpathAI: Emotion-Aware Mental Health Companion

## Project Overview
EmpathAI is an innovative AI-powered mental health companion designed to provide therapeutic interactions by understanding and responding to users' emotional states in real-time. By combining facial emotion recognition, speech processing, and advanced AI conversation capabilities, EmpathAI creates a supportive and empathetic digital environment for mental wellness.

## Team Information
- **Total Team Members**: 2

## Technology Stack
- **AI Models**: Google Gemini API
- **Text-to-Speech**: Neuphonic API
- **Emotion Detection**: face-api.js
- **Speech Recognition**: Web Speech API
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node server for real-time communication,

## Google Technologies Used
- **Have you used any Google technologies?** Yes
- **Have you used the Google Gemini API?** Yes

## The Problem: Mental Health Crisis in 2080

By 2080, the mental health landscape has transformed dramatically due to several converging factors. Extended human lifespans have resulted in multi-generational households struggling with complex family dynamics and unprecedented longevity-related psychological challenges. Digital immersion has reached extreme levels, with most humans spending over 90% of their time in virtual environments, leading to severe digital dependency syndrome and reality-perception disorders.

Climate-altered environments have forced massive population relocations, creating widespread displacement trauma and environmental grief. Technological automation has eliminated traditional work for most humans, causing widespread purpose crises and identity dissolution. The healthcare system, despite advances in physical medicine, remains woefully understaffed for mental health services, with an estimated ratio of 1 human therapist per 12,000 people.

These factors have created a global mental wellness catastrophe where traditional therapeutic approaches are simply unavailable to most of the population. Isolation, despite technological connectivity, has become the norm, with in-person human interaction becoming increasingly rare and valued. The result is a society where mental health support is a luxury rather than a right, and where millions suffer in digital isolation without adequate emotional and psychological support.

## Our Solution: EmpathAI

EmpathAI represents a revolutionary approach to addressing the 2080 mental health crisis. Our platform combines advanced emotional intelligence algorithms with personalized therapeutic interactions, providing on-demand mental health support accessible to anyone with a communication device.

The core innovation of EmpathAI is its multimodal emotion recognition system. Unlike previous generations of digital mental health tools, EmpathAI processes and understands human emotions through facial expression analysis, voice tone patterns, and natural language processing simultaneously. This creates a comprehensive emotional profile that evolves with each interaction, enabling genuinely personalized responses that traditional AI systems could never achieve.

The system also integrates with environmental sensors and biometric monitors, allowing it to suggest physical interventions for mental wellbeing, such as light therapy, exercise, or nature exposure when appropriate.

Most importantly, EmpathAI is designed to foster genuine human connection in a disconnected world. It operates as both a direct support system and a bridge to community, recommending relevant human interaction opportunities and facilitating support networks among users with similar experiences. By combining emotional intelligence and therapeutic expertise, EmpathAI transforms mental healthcare from a scarce resource to an abundant one.

## Code Summary

Our implementation features a web-based interface that captures real-time video and audio input from users. The frontend uses face-api.js to analyze facial expressions frame-by-frame, creating an emotion timeline throughout the conversation. Simultaneously, the Web Speech API transcribes the user's speech continuously.

When a user finishes speaking, the system packages the transcript, detected emotions, and emotion timeline into a structured format and sends it to our backend server. The server processes this data and forwards it to the Google Gemini API with specialized prompting that emphasizes therapeutic responses tailored to the user's emotional state.

The Gemini API generates contextually appropriate, empathetic responses which are sent back to the client. These responses are then converted to natural-sounding speech using the Neuphonic text-to-speech API, providing a seamless conversational experience.

The application utilizes Node.js for real-time communication between the frontend and backend, ensuring minimal latency in the conversation flow. This architecture creates a responsive system that can detect subtle emotional shifts and adapt its therapeutic approach accordingly, mimicking the nuanced understanding of a human therapist while being available 24/7.

## Getting Started

### Prerequisites
- Node.js and npm installed
- API keys for Google Gemini API and Neuphonic TTS
- Modern web browser with WebRTC support

### Installation
1. Clone the repository <br> https://github.com/SahilSaxena007/EmpathAI.git <br> cd empathai
2. Install dependencies
3. Set up environment variables, Create a `.env` file with your API keys:
  - GEMINI_API_KEY=`your_gemini_api_key`
  - NEUPHONIC_API_KEY=`your_neuphonic_api_key`
4. Start the server `npm start`
5. Open your browser and navigate to `http://localhost:3000`

## Usage
1. Click "Start Conversation" to begin the interaction
2. Speak naturally about your thoughts, feelings, or concerns
3. Click "Done Speaking" when you've finished your thought
4. EmpathAI will process your speech and emotions, then respond accordingly
5. Continue the conversation as long as needed

## Future Enhancements
EmpathAI doesn't aim to replace human therapists but rather to extend their reach dramatically. Each EmpathAI instance is continually supervised and fine-tuned by a network of human mental health professionals who can intervene when necessary, ensuring responsible AI use while maximizing their impact. We plan to build on this foundation with:
- Integration with wearable devices for biometric data
- Expanded language support
- Virtual reality immersive therapeutic environments
- Connection to community support networks
- Personalized mental wellness activity recommendations
