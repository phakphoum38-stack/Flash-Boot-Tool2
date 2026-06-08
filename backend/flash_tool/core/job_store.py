import json
import os
import time

JOB_DIR = "flash_jobs"

def save_job(job_id, data):
    os.makedirs(JOB_DIR, exist_ok=True)
    with open(f"{JOB_DIR}/{job_id}.json", "w") as f:
        json.dump(data, f)

def load_job(job_id):
    path = f"{JOB_DIR}/{job_id}.json"
    if not os.path.exists(path):
        return None
    return json.load(open(path))
