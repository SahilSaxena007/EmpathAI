import asyncio
import json
from hume import AsyncHumeClient
from hume.expression_measurement.batch import Face, Models
from hume.expression_measurement.batch.types import InferenceBaseRequest
from hume.core.api_error import ApiError

async def main():
    # Initialize Hume client with your API key
    client = AsyncHumeClient(api_key="IoMPaPWP7ZAqukytMQAS35aW8Adgi6r8BBiAyR9WvhN6QPKi")
    
    # Open the MP3 file (replace 'your_audio.mp3' with your file path)
    local_filepaths = [open("assets/sahil.mp4", mode="rb")]
    
    # Configure the model for analysis.
    # NOTE: Replace Face() with an appropriate audio model if available.
    model_config = Face()  # placeholder for audio analysis model
    models_chosen = Models(face=model_config)
    
    # Create the configuration object for the inference job
    config_request = InferenceBaseRequest(models=models_chosen)
    
    # Start an inference job using the local MP3 file
    job_id = await client.expression_measurement.batch.start_inference_job_from_local_file(
        json=config_request, file=local_filepaths
    )
    print("Job ID:", job_id)
    
    # Poll until the job completes
    while True:
        try:
            job_predictions = await client.expression_measurement.batch.get_job_predictions(id=job_id)
            break  # Exit loop once predictions are available
        except ApiError as e:
            if "Job is in progress" in str(e):
                print("Job in progress, waiting 10 seconds...")
                await asyncio.sleep(10)
            else:
                raise  # Re-raise any other errors
    
    # Output predictions and save them to a text file
    print("Predictions:", job_predictions)
    with open("predictions.txt", "w") as f:
        f.write(json.dumps(job_predictions, indent=4))
    print("Predictions saved to predictions.txt")

if __name__ == "__main__":
    asyncio.run(main())
