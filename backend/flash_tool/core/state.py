import json
import os

def save_state(path, data):
    try:
        with open(path, "w") as f:
            json.dump(data, f)
    except:
        pass


def load_state(path):
    try:
        if not os.path.exists(path):
            return None
        with open(path, "r") as f:
            return json.load(f)
    except:
        return None
