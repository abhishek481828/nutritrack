# Running NutriTrack with Docker

This guide explains how to spin up NutriTrack in a production-ready, local containerized environment using Docker and Docker Compose.

---

## Prerequisites

Ensure you have the following installed on your machine:
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (macOS / Windows) or [Docker Engine](https://docs.docker.com/engine/install/) (Linux)
* [Docker Compose v2](https://docs.docker.com/compose/)

---

## Environment Configuration

Before launching the containers, configure your environment variables. You can create a `.env` file in the project root to override settings:

```bash
# OpenAI Secret Key (Required for AI Chat / Nutrition Coach assistant)
OPENAI_API_KEY=your_openai_api_key_here

# Spoonacular API (Optional, for recipe lookup fallback)
SPOONACULAR_API_KEY=your_spoonacular_key_here

# Cloudinary Config (Required for Image uploads / Photo Analysis)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Secret key for JWT signing (Defaults to a secure fallback if not provided)
JWT_SECRET=some_long_secure_random_string_here
```

---

## Getting Started

### 1. Build and Start the Services

To compile the images and launch the three services (MongoDB, Backend, and Frontend Nginx server) in the background, run:

```bash
docker compose up -d --build
```

### 2. Verify Container Health

Run the following command to check the startup status:

```bash
docker compose ps
```

You should see:
* `nutritrack-db` running on port `27017` with status `healthy`
* `nutritrack-backend` running on port `5000` with status `healthy`
* `nutritrack-frontend` running on port `80` with status `healthy`

### 3. Open the Application

Navigate to:
🔗 [http://localhost](http://localhost)

---

## Seed Database Foods (Optional)

Once the containers are running and healthy, you can seed standard food items (like Indian meals) directly into the MongoDB container:

```bash
docker compose exec backend node seeds/indianFoods.js
```

---

## Helpful Commands

### View Logs

To tail the combined logs from all active services:

```bash
docker compose logs -f
```

To view logs for a specific service:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### Stop Containers

To stop and remove containers and network interfaces (while keeping the MongoDB volume safe):

```bash
docker compose down
```

To stop containers and delete the database storage volumes completely:

```bash
docker compose down -v
```
