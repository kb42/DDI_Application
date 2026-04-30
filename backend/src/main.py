"""
minimal backend wrapper that proxies requests to the llm backend service

this keeps the application code separate from the llm logic,
treating the llm backend as an external microservice
"""
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="DDI Application API")

# cors for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# llm backend service url (separate microservice)
LLM_BACKEND_URL = os.getenv("LLM_BACKEND_URL", "http://localhost:8000")


class QueryRequest(BaseModel):
    question: str


class ExpandRequest(BaseModel):
    node_name: str


@app.get("/health")
async def health_check():
    """health check endpoint"""
    return {"status": "healthy", "service": "ddi-application"}


@app.post("/api/query")
async def query_drug_interactions(request: QueryRequest):
    """
    proxy natural language queries to the llm backend service

    the llm backend handles:
    - prompt construction
    - llm orchestration
    - neo4j query generation
    - graph data retrieval
    """
    try:
        # forward request to llm backend microservice
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{LLM_BACKEND_URL}/api/query",
                json={"question": request.question}
            )
            response.raise_for_status()
            return response.json()

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"llm backend error: {e.response.text}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"cannot connect to llm backend service: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"internal server error: {str(e)}"
        )


@app.get("/api/graph/init")
async def get_initial_graph():
    """proxy to fetch top 10 drugs and top 5 diagnoses for the initial canvas"""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(f"{LLM_BACKEND_URL}/api/graph/init")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"llm backend error: {e.response.text}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"cannot connect to llm backend service: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"internal server error: {str(e)}"
        )


@app.post("/api/graph/expand")
async def expand_node(request: ExpandRequest):
    """proxy to fetch all neighbors of a given node"""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{LLM_BACKEND_URL}/api/graph/expand",
                json={"node_name": request.node_name}
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"llm backend error: {e.response.text}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"cannot connect to llm backend service: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"internal server error: {str(e)}"
        )
