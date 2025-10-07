# Project Overview

## Purpose

**open-process-mining** is an open-source process mining platform providing an end-to-end workflow from data preparation to analysis and visualization. It separates concerns between data engineers and process analysts, offering optimized tools for each role.

## Target Users

1. **Data Engineers/Analysts (CLI Users)**: Build reproducible data pipelines and analyses using dbt and Python scripts
2. **Process Analysts/Business Improvement Staff (Web UI Users)**: Interactively explore pre-prepared data in the browser

## Architecture

The project follows a 3-layer architecture:

### 1. Data Transformation Layer (dbt Core)

- Transforms raw data into event log format
- Uses PostgreSQL as data store (`public` schema)
- Main tables: `fct_event_log`, `fct_case_outcomes`, master tables for employees/departments

### 2. Backend (Python)

- **Analysis scripts**: Generate DFG (Directly-Follows Graph) from event logs, calculate performance metrics
- **API server (FastAPI)**: Provides REST APIs for process analysis, organization analysis, and outcome analysis
- Main endpoints:
  - `/process/*`: Process analysis APIs
  - `/organization/*`: Organization analysis APIs (handover, workload, performance)
  - `/outcome/*`: Outcome analysis APIs (path outcomes, segment comparison)

### 3. Frontend (React + TypeScript)

- **Framework**: React with TypeScript
- **Graph visualization**: `@xyflow/react` (React Flow)
- **Auto-layout**: `elkjs`
- **State management**: `zustand`
- **UI library**: Chakra UI
- Main features: Interactive process maps, path filtering, metrics switching, organization analysis, outcome analysis

## Tech Stack

- **Data transformation**: dbt Core, PostgreSQL
- **Backend**: Python 3.11, FastAPI, Pandas, NetworkX, SQLAlchemy
- **Frontend**: React, TypeScript, Vite, Chakra UI, React Flow
- **Infrastructure**: Docker Compose
- **License**: MIT
