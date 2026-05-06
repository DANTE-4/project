"""Compatibility entrypoint for running `uvicorn main:app` from the backend directory.

This re-exports the FastAPI app defined in app.main so both of these work:
- uvicorn main:app --reload
- uvicorn app.main:app --reload
"""

from app.main import app
