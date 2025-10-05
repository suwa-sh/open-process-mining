from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import router, common_router
from src.api.analyze_routes import router as analyze_router
from src.api.organization_routes import router as organization_router
from src.api.outcome_routes import router as outcome_router

# Create FastAPI application
app = FastAPI(
    title="Open Process Mining API",
    description="""
## オープンソースのプロセスマイニングプラットフォーム

データ準備から分析、可視化までの一貫したワークフローを提供するREST APIです。

### 主要機能

#### プロセス分析
- DFG (Directly-Follows Graph) ベースのプロセス発見
- パスフィルタリング、ハッピーパス検出
- プロセス比較（改善前後の効果測定）

#### 組織分析
- ハンドオーバーネットワーク分析（社員/部署間の連携）
- 作業負荷分析（アクティビティ数・ケース数）
- パフォーマンス分析（平均処理時間・中央値・合計時間）

#### 成果分析
- パス別成果分析（各パスの平均値・中央値・合計値）
- セグメント比較分析（高成果 vs 低成果パスの比較）

### 技術スタック
- **バックエンド**: Python 3.11, FastAPI, SQLAlchemy, Pandas, NetworkX
- **データベース**: PostgreSQL 15
- **ライセンス**: MIT License
    """,
    version="1.0.0",
    contact={
        "name": "open-process-mining",
        "url": "https://github.com/suwa-sh/open-process-mining",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(common_router)  # 共通エンドポイント（プレフィックスなし）
app.include_router(router)
app.include_router(analyze_router)
app.include_router(organization_router)
app.include_router(outcome_router)


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Open Process Mining API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "process_types": "/process/process-types",
            "analyses": "/process/analyses",
            "analysis_by_id": "/process/analyses/{analysis_id}",
            "compare": "/process/compare?before={id1}&after={id2}",
            "analyze": "/analyze (POST)",
            "preview": "/preview",
            "organization_handover": "/organization/handover",
            "organization_workload": "/organization/workload",
            "organization_performance": "/organization/performance",
        },
    }
