from fastapi import FastAPI

app = FastAPI(
    title="Virion Labs Unified API",
    description="The central API for all Virion Labs services.",
    version="0.1.0",
)

@app.get("/health", tags=["Status"])
async def health_check():
    """
    Health check endpoint to confirm the API is running.
    """
    return {"status": "ok"}
