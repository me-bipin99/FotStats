from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

from routes.estimate import router as estimate_router
from routes.predict import router as predict_router
from routes.cluster import router as cluster_router
from routes.optimize import router as optimize_router
from routes.insights import router as insights_router
from utils.model_loader import init_models

# Configure logging
logging.basicConfig(level=os.getenv('LOG_LEVEL', 'INFO'))
logger = logging.getLogger(__name__)

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("ML Service starting up")
    try:
        init_models()  # Initialize all ML models once
        logger.info("✅ Models loaded successfully")
    except Exception as e:
        logger.error(f"❌ Failed to load models: {e}")
        raise
    yield
    # Shutdown
    logger.info("ML Service shutting down")

# Create FastAPI app
app = FastAPI(
    title="FotNep ML Service",
    description="Machine Learning service for football analytics",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "ml-service",
        "version": "1.0.0"
    }

# Register routers
app.include_router(estimate_router, prefix="/api/v1", tags=["Estimation"])
app.include_router(predict_router, prefix="/api/v1", tags=["Prediction"])
app.include_router(cluster_router, prefix="/api/v1", tags=["Clustering"])
app.include_router(optimize_router, prefix="/api/v1", tags=["Optimization"])
app.include_router(insights_router, prefix="/api/v1", tags=["Insights"])

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv('ML_SERVICE_PORT', 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
