"""Pytest configuration file to setup Python path."""

import sys
from pathlib import Path

# Add parent directory to sys.path to allow importing from src
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))
