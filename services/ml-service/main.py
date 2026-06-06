from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routes (import as implemented)
# from models.consensus import router as consensus_router
# from models.player_estimator import router as estimator_router
# from models.squad_optimizer import router as squad_router

app = FastAPI(
    title="FotNep ML Service",
    description="Machine learning algorithms for Nepali football analytics",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

# Mount algorithm routers when implemented
# app.include_router(consensus_router)
# app.include_router(estimator_router)
# app.include_router(squad_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "fotnep-ml", "version": "1.0.0"}
