import os
import httpx
from pathlib import Path
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from pydantic import BaseModel

# Google Auth imports for server-side token fetching
import google.auth.transport.requests as auth_requests
import google.oauth2.id_token as id_token_lib
import google.auth.exceptions # Import the exceptions module directly for cleaner catching

# --- Pydantic Models for Chat Request/Response ---
# Assuming a simple message string for the chat interaction
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

# --- Configuration ---
# Target Cloud Run URL for the agentic API
# Use your actual Cloud Run service URL here
TARGET_CLOUD_RUN_URL = os.getenv("TARGET_CLOUD_RUN_URL", "https://dpi-agent-demo-903496459467.asia-east1.run.app/chat")
# Enable/disable Google Auth from the proxy via an environment variable
# Set to "false" to disable server-side token fetching for local testing without gcloud auth.
_google_auth_enabled = os.getenv("GOOGLE_AUTH_ENABLED", "true").lower() == "true"

# Allowed origins for CORS (for your Angular frontend)
# For local development, set to "http://localhost:8080"
# For deployment, set to your Angular app's Cloud Run URL, e.g., "https://your-angular-app.run.app"
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:8080").split(',')

# --- FastAPI web app ---
app = FastAPI()

# --- CORS Middleware Setup ---
def setup_cors(fastapi_app: FastAPI):
    """
    Configures CORS (Cross-Origin Resource Sharing) middleware for the FastAPI application.
    Allowed origins are loaded from the ALLOWED_ORIGINS environment variable.
    """
    fastapi_app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Configure CORS for the server
setup_cors(app)

# --- API Proxy Endpoint ---
@app.api_route("/api/chat", methods=["GET", "POST", "OPTIONS"])
async def chat_proxy_endpoint(request: Request): # Renamed to avoid confusion with internal ChatRequest model
    print(f"[{request.method}] /api/chat received request.")

    # Handle OPTIONS (CORS Preflight)
    if request.method == "OPTIONS":
        print("Handling OPTIONS preflight request.")
        return Response(status_code=204)

    # Ensure TARGET_CLOUD_RUN_URL is set
    if not TARGET_CLOUD_RUN_URL:
        raise HTTPException(
            status_code=500, detail="TARGET_CLOUD_RUN_URL is not set."
        )

    headers = {"Content-Type": "application/json"}

    # Only attempt to fetch ID token if Google Auth is enabled
    if _google_auth_enabled:
        try:
            auth_req = auth_requests.Request()
            # The audience for the ID token should be the URL of the target Cloud Run service
            # This fetches an ID token using the service account associated with THIS Cloud Run service
            id_token = id_token_lib.fetch_id_token(auth_req, TARGET_CLOUD_RUN_URL)
            headers["Authorization"] = f"Bearer {id_token}"
            print(f"Successfully fetched ID token for Cloud Run authentication.")
        except google.auth.exceptions.DefaultCredentialsError as e:
            print(f"Default credentials error: {e}. Cannot authenticate call to target Cloud Run service.")
            raise HTTPException(
                status_code=500, detail="Authentication failed: Default credentials not found. Ensure `gcloud auth application-default login` for local testing, or correct service account for Cloud Run deployment."
            )
        except google.auth.exceptions.RefreshError as e:
            print(f"Token refresh error: {e}. Cannot authenticate call to target Cloud Run service.")
            raise HTTPException(
                status_code=500, detail="Authentication failed: Unable to refresh ID token."
            )
        except Exception as e:
            print(f"An unexpected error occurred while fetching ID token: {e}")
            raise HTTPException(
                status_code=500, detail=f"Authentication failed unexpectedly: {e}"
            )
    else:
        print("Google Cloud Run authentication is disabled via environment variable (`GOOGLE_AUTH_ENABLED=false`).")

    # Read the incoming request body from the Angular client
    try:
        # FastAPI's request.json() will parse the body into a Python dict/list
        incoming_request_data = await request.json()
        print(f"Incoming request body from UI: {incoming_request_data}")
        
        # Validate against ChatRequest Pydantic model if needed, or directly use
        # Here, we assume the incoming JSON matches the structure the TARGET_CLOUD_RUN_URL expects
        # For this simplified example, we'll just pass it through.
        # If your target Cloud Run expects a specific Pydantic model (like the more complex ChatRequest),
        # you might do: validated_request = ChatRequest(**incoming_request_data)
        # and then use validated_request.model_dump_json() for forwarding.
        # For now, let's keep it simple and just forward the dictionary as JSON.
        
    except Exception as e:
        print(f"Error parsing incoming JSON from UI: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON body received from client.")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                TARGET_CLOUD_RUN_URL,
                headers=headers,
                json=incoming_request_data, # Use json= for automatic serialization of dict
                timeout=60.0
            )
            response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)
            
            # Assuming the target Cloud Run service returns a JSON response
            external_response_data = response.json()
            print(f"Received response from external service: {external_response_data}")
            
            # Return the external response directly to the Angular client
            return JSONResponse(content=external_response_data, status_code=response.status_code)

    except httpx.RequestError as exc:
        print(f"An error occurred while requesting {exc.request.url!r}: {exc}")
        raise HTTPException(
            status_code=503, detail=f"Failed to connect to external chat service: {exc}"
        )
    except httpx.HTTPStatusError as exc:
        print(f"Error response {exc.response.status_code} while requesting {exc.request.url!r}: {exc.response.text}")
        # Pass the original status code and detail from the upstream service
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"External chat service returned an error: {exc.response.text}",
        )
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")


# --- Serve Angular Static Files (MUST be defined AFTER all API routes) ---
# This mount serves all files directly from the 'static' directory.
# `html=True` is crucial: if a file isn't found (e.g., when the Angular router
# tries to handle a path like /some-route), it will serve 'index.html', allowing
# Angular's client-side routing (HTML5 pushState) to take over.
# This ensures correct MIME types for all your JS, CSS, etc., files.
STATIC_FILES_DIR = Path("static")
app.mount("/", StaticFiles(directory=STATIC_FILES_DIR, html=True), name="static")


# --- Fallback for Angular routing (catch-all for HTML5 pushState) ---
# This ensures that when Angular routes (e.g., /chat, /login) are directly accessed,
# index.html is served, allowing Angular to handle the routing.
@app.get("/{full_path:path}")
async def serve_angular_app(full_path: str):
    index_file_path = "static/index.html"
    try:
        with open(index_file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return Response(content=content, media_type="text/html")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Index file not found.")