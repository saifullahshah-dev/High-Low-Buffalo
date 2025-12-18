import sys
import os

# Add the backend directory to the python path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from main import app
    print("Successfully imported app from main.py")
except Exception as e:
    print(f"Failed to import app: {e}")
    sys.exit(1)