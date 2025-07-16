# Use the official Python lightweight image
FROM python:3.13-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy requirements first for better caching
COPY requirements.txt /app/requirements.txt

# Set the working directory
WORKDIR /app

# Allow statements and log messages to immediately appear in the logs
ENV PYTHONUNBUFFERED=1

# Install dependencies
RUN uv pip install --system -r requirements.txt

# Copy the project files into the container
COPY . .

# Expose the port the server will run on
EXPOSE 8080

# Run the FastMCP server
CMD ["python", "server.py"]
