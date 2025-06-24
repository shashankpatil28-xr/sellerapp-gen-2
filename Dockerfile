

# Stage 1: Build the Angular frontend
FROM node:20-alpine AS angular_builder

WORKDIR /app

# Copy package.json and install Angular CLI and dependencies
COPY package.json package-lock.json ./
RUN npm install     

# Copy the rest of the frontend source code
COPY . .

# Build the Angular application for production
# *** IMPORTANT: No --base-href for serving from root (/) ***
RUN npm run build 

# Stage 2: Build the FastAPI backend
FROM python:3.11-slim-bookworm AS fastapi_builder

WORKDIR /app

# Copy server requirements and install them
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the FastAPI application code
COPY server .

# Copy the built Angular frontend into the 'static' directory
# This matches the STATIC_FILES_DIR = Path("static") in your main.py
COPY --from=angular_builder /app/dist/test-sellerapp/browser ./static

# Expose port 80 (internal to container)
EXPOSE 80

# Command to run the FastAPI application with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]
