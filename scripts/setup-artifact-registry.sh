#!/bin/bash

# Exit on error
set -e

PROJECT_ID="${1:-your-project-id}"
REGION="${2:-europe-west1}"
REPO_NAME="backend"

echo "Creating Artifact Registry repository '$REPO_NAME' in project '$PROJECT_ID'..."

gcloud artifacts repositories create "backend" \
  --repository-format=docker \
  --location="europe-west3" \
  --project="$PROJECT_ID" \
  --description="Docker images for backend service" || echo "Repository already exists"

echo "Artifact Registry created (or already exists)"