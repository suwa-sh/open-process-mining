FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install dbt-core and dbt-postgres
RUN pip install dbt-core==1.7.3 dbt-postgres==1.7.3

# Copy application code
COPY src/ ./src/

# Make directory for dbt
RUN mkdir -p /app/dbt

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
