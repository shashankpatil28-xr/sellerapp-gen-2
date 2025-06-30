# test-sellerapp Project

## 1. Project Details and Instructions for Local Setup

### Project Description
The `test-sellerapp` project is a web application built using Angular for the frontend and FastAPI for the backend. It features an AI chat interface that allows users to interact with an AI model. The application is designed to be deployed on Google Cloud Run.

### Architecture
*   **Frontend:** An Angular application providing the user interface.
*   **Backend:** A FastAPI server acting as an API gateway and proxy for the AI model.
*   **AI Interaction:** The backend communicates with an external AI service (agentic Cloud Run service).
*   **Authentication:** Google Sign-In is used for user authentication.
* **Containerized:** The application is packaged in a Docker container.

### Local Setup
1.  **Clone the repository:**
    ```bash
    git clone <your_repository_url>
    cd test-sellerapp
    ```
2.  **Install dependencies:**
    *   **Angular:**
        ```bash
        npm install
        ```
    *   **FastAPI:**
        ```bash
        cd server
        python3 -m venv venv
        source venv/bin/activate
        pip install .
        cd ..
        ```
3.  **Run the application:**
    *   **Angular:**
        ```bash
        ng serve
        ```
        This will start the Angular development server, accessible at `http://localhost:4200`.
    *   **FastAPI:**
        ```bash
        uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
        ```
        This will start the FastAPI server, accessible at `http://localhost:8000`.
4. **Docker:**
    *   **Build:**
        ```bash
        docker build -t test-sellerapp .
        ```
    *   **Run:**
        ```bash
        docker run -p 4200:4200 -p 8000:8000 test-sellerapp
        ```
        This will run the docker image, exposing the ports for angular and fastAPI.

5.  **Access the application:**
    Open your browser and go to `http://localhost:4200`. The Angular frontend will connect to the FastAPI backend at `http://localhost:8000`.

**Note:** Local development might not fully replicate the behavior of the deployed application due to several factors:
    *   **Identity-Aware Proxy (IAP):** The agentic service is behind IAP, which requires a valid gcloud authentication token for an allowed user. This token cannot be passed through localhost.
    *   **gcloud Authentication:** The application requires a gcloud auth token to access the agentic service, which is not available in local development.
    * **CORS Issue:** There might be CORS issue with localhost, as the deployed service will have a different origin.

To test your changes, you will need to redeploy the application to Cloud Run as described in the next sections.

## 2. Project Features in Short

*   AI Chat Interface: Conversational interface for interacting with an AI.
*   Google Authentication: Secure login with Google Sign-In.
*   Backend API: FastAPI server for handling AI requests.
*   Chat State Management: Manages the flow and storage of chat messages.
*   Dockerized Application: Easy to deploy in container environments.

## 3. Build and Deployment Details

### Build Process
*   **Angular Build:** The Angular application is built using `ng build`, which compiles the code and generates static files.
*   **Docker Image:** A Dockerfile is used to package the Angular build output and the FastAPI server into a Docker image.
*   **Image Tagging:** The Docker image is tagged with a specific URI for Artifact Registry.

### Deployment Process
*   **Artifact Registry:** The Docker image is pushed to Google Cloud Artifact Registry.
*   **Cloud Run Deployment:** The Docker image is deployed to Google Cloud Run, creating a managed service.
*   **Environment Variables:** Cloud Run is configured with environment variables for the target AI service URL, allowed origins, and authentication settings.

## 4. Deployment Commands in Detail

### Prerequisites

*   Google Cloud SDK installed and configured.
*   Docker installed.
*   A Google Cloud Project with Artifact Registry and Cloud Run enabled.

### Deployment Steps

1.  **Set Project and Service Variables:**

    ```bash
    # Your Google Cloud Project ID
    export GOOGLE_CLOUD_PROJECT="ondc-seller-dev"

    # The region where your Cloud Run service will be deployed
    export REGION="asia-east1"

    # The name of your Artifact Registry repository
    export REPOSITORY_NAME="cloud-run-repo"

    # The name for your Docker image within Artifact Registry
    export IMAGE_NAME="sellerapp-generative-app"

    # The name of your Cloud Run service
    export SERVICE_NAME="sellerapp-generative-new"

    # Using 'latest' as the build tag
    export BUILD_ID="latest"

    export PROJECT_NUMBER=$(gcloud projects describe ${GOOGLE_CLOUD_PROJECT} --format="value(projectNumber)")

    # Construct the full image URI
    export IMAGE_URI="${REGION}-docker.pkg.dev/${GOOGLE_CLOUD_PROJECT}/${REPOSITORY_NAME}/${IMAGE_NAME}:${BUILD_ID}"

    echo "Project ID: $GOOGLE_CLOUD_PROJECT"
    echo "Region: $REGION"
    echo "Repository Name: $REPOSITORY_NAME"
    echo "Image Name: $IMAGE_NAME"
    echo "Service Name: $SERVICE_NAME"
    echo "Image Tag: $BUILD_ID"
    echo "Full Image URI: $IMAGE_URI"
    ```

2.  **Build the Docker Image:**

    ```bash
    docker build -t ${IMAGE_URI} .
    ```

3.  **Push the Docker Image to Artifact Registry:**

    ```bash
    gcloud auth configure-docker ${REGION}-docker.pkg.dev
    docker push ${IMAGE_URI}
    ```

4.  **Deploy the Image to Cloud Run (Initial Deployment):**

    ```bash
    gcloud run deploy ${SERVICE_NAME} \
      --image ${IMAGE_URI} \
      --platform managed \
      --port 80 \
      --region ${REGION} \
      --allow-unauthenticated \
      --service-account=${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
      --set-env-vars TARGET_CLOUD_RUN_URL="https://dpi-agent-demo-903496459467.asia-east1.run.app/chat" \
      --set-env-vars ALLOWED_ORIGINS="*" \
      --set-env-vars GOOGLE_AUTH_ENABLED="true"
    ```

5.  **Update `ALLOWED_ORIGINS` (Recommended):**

    *   After the initial deployment, get the Cloud Run URL (it will be outputted by the previous command).
    *   Replace `*` in the `ALLOWED_ORIGINS` environment variable with your specific Cloud Run URL.
    *   Re-deploy the service with the updated `ALLOWED_ORIGINS`:

    ```bash
    gcloud run deploy ${SERVICE_NAME} \
      --image ${IMAGE_URI} \
      --platform managed \
      --port 80 \
      --region ${REGION} \
      --allow-unauthenticated \
      --service-account=${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
      --set-env-vars TARGET_CLOUD_RUN_URL="https://dpi-agent-demo-903496459467.asia-east1.run.app/chat" \
      --set-env-vars ALLOWED_ORIGINS="https://your-service-name-hash-region.run.app" \
      --set-env-vars GOOGLE_AUTH_ENABLED="true"
    ```
    Replace `https://your-service-name-hash-region.run.app` with your actual Cloud Run URL.

### Explanation of Flags:

*   `--allow-unauthenticated`: Makes your service publicly accessible.
*   `--service-account`: Uses the default Compute Engine service account.
*   `--set-env-vars`: Sets the environment variables inside your Cloud Run container.

This setup allows your Angular frontend to communicate with your FastAPI backend, which in turn communicates with your agentic Cloud Run service.