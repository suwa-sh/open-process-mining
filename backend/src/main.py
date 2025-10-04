from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import router
from src.api.analyze_routes import router as analyze_router
from src.api.organization_routes import router as organization_router

# Create FastAPI application
app = FastAPI(
    title="Open Process Mining API",
    description="API for process mining analysis and visualization",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)
app.include_router(analyze_router)
app.include_router(organization_router)


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Open Process Mining API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "process_types": "/process-types",
            "analyses": "/analyses",
            "analysis_by_id": "/analyses/{analysis_id}",
            "compare": "/compare?before={id1}&after={id2}",
            "analyze": "/analyze (POST)",
            "preview": "/preview",
            "organization_handover": "/organization/handover",
            "organization_workload": "/organization/workload",
            "organization_performance": "/organization/performance"
        }
    }
