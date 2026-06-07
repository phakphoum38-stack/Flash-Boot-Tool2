import os
import json

def save_state(job_id, state):
    os.makedirs("state", exist_ok=True)
    with open(f"state/{job_id}.json", "w") as f:
        json.dump(state, f)

def load_state(job_id):
    path = f"state/{job_id}.json"
    if not os.path.exists(path):
        return None
    return json.load(open(path))
