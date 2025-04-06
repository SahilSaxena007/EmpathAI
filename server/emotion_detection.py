import asyncio
from hume import AsyncHumeClient
from hume.expression_measurement.batch import Face, Models
from hume.core.api_error import ApiError
from hume.expression_measurement.batch.types import InferenceBaseRequest

async def main():
    # Initialize an authenticated client
    client = AsyncHumeClient(api_key="IoMPaPWP7ZAqukytMQAS35aW8Adgi6r8BBiAyR9WvhN6QPKi")
    
    # Define the local video file to analyze
    local_filepaths = [open("assets/sahil.mp4", mode="rb")]
    
    # Configure the model (e.g., facial expression analysis)
    face_config = Face()  # default settings
    models_chosen = Models(face=face_config)
    
    # Create configuration object
    stringified_configs = InferenceBaseRequest(models=models_chosen)
    
    # Start an inference job using your local video file
    job_id = await client.expression_measurement.batch.start_inference_job_from_local_file(
        json=stringified_configs, file=local_filepaths
    )
    print("Job ID:", job_id)
    
    # Poll until job is complete
    while True:
        try:
            job_predictions = await client.expression_measurement.batch.get_job_predictions(id=job_id)
            break  # If successful, exit loop
        except ApiError as e:
            # If the error message indicates that the job is still in progress, wait and try again
            if "Job is in progress" in str(e):
                print("Job still in progress. Waiting 10 seconds...")
                await asyncio.sleep(10)
            else:
                raise  # For any other error, re-raise

    # Assuming job_predictions is your predictions data
    with open("job_predictions.txt", "w") as f:
        f.write(str(job_predictions))


if __name__ == "__main__":
    asyncio.run(main())
