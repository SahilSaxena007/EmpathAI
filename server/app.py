from flask import Flask, request, jsonify
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Define the folder where files will be stored
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'assets')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create assets folder if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/saveVideo', methods=['POST'])
def save_video():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    video_file = request.files['video']
    filename = secure_filename(video_file.filename)
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    video_file.save(save_path)
    return jsonify({'message': 'Video saved successfully', 'filename': filename})

@app.route('/saveAudio', methods=['POST'])
def save_audio():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    audio_file = request.files['audio']
    filename = secure_filename(audio_file.filename)
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    audio_file.save(save_path)
    return jsonify({'message': 'Audio saved successfully', 'filename': filename})

if __name__ == '__main__':
    app.run(debug=True)
