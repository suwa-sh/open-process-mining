# Code Structure

## Directory Layout

```
open-process-mining/
├── backend/           # Python backend (FastAPI)
│   ├── src/
│   │   ├── analysis/      # DFG discovery, performance metrics
│   │   ├── api/           # FastAPI route handlers
│   │   ├── db/            # Database connection
│   │   ├── models/        # SQLAlchemy models
│   │   ├── services/      # Business logic (analyze, organization, outcome)
│   │   └── main.py        # FastAPI application entrypoint
│   ├── tests/         # Backend tests (pytest)
│   └── sql/           # Database initialization scripts
├── frontend/          # React frontend
│   └── src/
│       ├── api/           # API client functions
│       ├── components/    # React components (ProcessMap, Charts, Modals)
│       ├── hooks/         # Custom React hooks (useLayout, useAnalysisData)
│       ├── stores/        # Zustand state management
│       ├── types/         # TypeScript type definitions
│       └── App.tsx        # React application entrypoint
├── dbt/               # dbt Core data pipeline
│   ├── models/
│   │   ├── staging/       # Source-specific transformations
│   │   └── marts/         # Final event log tables
│   ├── seeds/         # CSV sample data files
│   ├── tests/         # dbt data tests
│   └── dbt_project.yml
├── e2e/               # Playwright E2E tests
├── scripts/           # Utility scripts (generate_sample_data.py)
└── .qlty/             # Code quality configuration

```

## Backend Architecture

### Key Modules

- **main.py**: FastAPI app initialization, CORS middleware, route registration
- **api/**: Route handlers organized by feature
  - `routes.py`: Process analysis endpoints
  - `organization_routes.py`: Organization analysis endpoints
  - `outcome_routes.py`: Outcome analysis endpoints
- **services/**: Business logic layer
  - `analyze_service.py`: Process analysis logic
  - `organization_service.py`: Handover, workload, performance analysis
  - `outcome_service.py`: Path outcome, segment comparison analysis
- **analysis/**: Core algorithms
  - `dfg_discovery.py`: DFG (Directly-Follows Graph) generation
  - `performance_metrics.py`: Performance calculation
- **models/**: SQLAlchemy ORM models
  - `event_log.py`: Event log table
  - `analysis_result.py`: Analysis results table
  - `outcome.py`: Outcome data table

### Database Schema

- **fct_event_log**: Process mining event log with organization info
- **fct_case_outcomes**: Case-level outcome metrics
- **process_analysis_results**: Process analysis results (JSONB)
- **organization_analysis_results**: Organization analysis results (JSONB)
- **outcome_analysis_results**: Outcome analysis results (JSONB)
- **master_employees**: Employee master data
- **master_departments**: Department master data

## Frontend Architecture

### Key Components

**Process Analysis**:

- `ProcessMap.tsx`: Main DFG visualization (React Flow + ELK layout)
- `ActionNode.tsx`: Custom node for activities
- `AnalysisList.tsx`: Analysis list view
- `CreateAnalysisModal.tsx`: New analysis creation modal

**Organization Analysis**:

- `OrganizationAnalysisList.tsx`: Organization analysis list
- `OrganizationAnalysisDetail.tsx`: Detail view with 3 tabs
- `HandoverNetwork.tsx`: Handover network visualization
- `WorkloadChart.tsx`, `PerformanceChart.tsx`: Charts
- `OrganizationNode.tsx`: Custom node for organization entities

**Outcome Analysis**:

- `OutcomeAnalysisList.tsx`: Outcome analysis list
- `OutcomeAnalysisDetail.tsx`: Detail view
- `OutcomeProcessMap.tsx`: Process map with outcome metrics
- `SegmentComparison.tsx`: Segment comparison view

### State Management

- **Zustand stores**: Global state for analyses, filters, UI states
- **Custom hooks**:
  - `useLayout.ts`: ELK.js auto-layout integration
  - `useAnalysisData.ts`: Data fetching and caching

## dbt Data Pipeline

### Model Structure

- **staging/**: Source-specific transformations
  - `stg_order_delivery.sql`: Order-delivery process staging
  - `stg_employee_onboarding.sql`: Employee onboarding staging
  - (6 process types total)
  - `stg_all_events.sql`: UNION ALL of all processes
- **marts/**: Final tables
  - `fct_event_log.sql`: Final event log with organization info
  - `fct_case_outcomes.sql`: Outcome data aggregation

### Data Flow

1. CSV files in `seeds/` → `dbt seed` → Raw tables in DB
2. Raw tables → `dbt run` (staging models) → Standardized staging views
3. Staging views → `dbt run` (marts models) → Final fact tables
4. Python analysis scripts → Read fact tables → Write analysis results

## Testing Structure

- **backend/tests/**: pytest unit tests
- **e2e/**: Playwright E2E tests
  - Process analysis flows
  - Organization analysis flows
  - Outcome analysis flows
