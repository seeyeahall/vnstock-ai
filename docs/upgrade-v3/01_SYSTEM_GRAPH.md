# VNStock AI v3.0 — System Graph & Dependency Map

> **Mục đích**: Mô tả chi tiết toàn bộ liên kết graph của hệ thống — từ Executive Brain đến từng Agent, từng tầng xử lý, và từng kênh output. Dùng Mermaid syntax để bất kỳ AI nào cũng có thể đọc hiểu và triển khai.
> **Ngày cập nhật**: 2026-06-07

---

## 1. System Architecture Graph (Tổng thể)

```mermaid
graph TB
    subgraph T0["TẦNG 0: EXECUTIVE BRAIN"]
        EB[Executive Brain<br/>AI COO]
        GM[Goal Manager]
        PE[Precheck Engine]
        TP[Task Planner]
        R9[9Router]
        SM[State Manager]
        RE[Recovery Engine]
        RC[Resource Controller]
        AE[Audit Engine]
    end

    subgraph T1["TẦNG 1: DATA INGESTION"]
        YT[YouTube Collector<br/>29 kênh]
        SF[Stock Data Fetcher<br/>VNStock API]
        NC[RSS News Collector<br/>CafeF/VietStock]
        WS[Website Scraper<br/>CTCK Reports]
        DM[Data Merge<br/>+ Deduplicate]
    end

    subgraph T2["TẦNG 2: GROUNDING"]
        SQ[SQLite Local]
        QD[Qdrant Vector]
        GD[Google Drive]
        NL[NotebookLM]
        GCC[Gemini Context Cache]
    end

    subgraph T3["TẦNG 3: SYNTHESIS"]
        MP[Meta-Prompt 5 Bước]
        AD[Anomaly Detection]
        MR[Market Regime Classifier]
        CR[Cross-Reference Engine]
        IE[Insight Extractor]
    end

    subgraph T4["TẦNG 4: DELIVERY"]
        RB[Report Builder]
        TG[Telegram]
        EM[Email]
        NT[Notion]
        DB[Dashboard]
        AU[Audio TTS]
        CH[Charts]
        G3[3D Graph]
    end

    EB --> GM
    EB --> PE
    EB --> TP
    EB --> R9
    EB --> SM
    EB --> RE
    EB --> RC
    EB --> AE

    PE --> |PASS| TP
    PE --> |FAIL| RE
    RE --> |Retry| PE

    TP --> YT
    TP --> SF
    TP --> NC
    TP --> WS

    YT --> DM
    SF --> DM
    NC --> DM
    WS --> DM

    DM --> SQ
    DM --> QD
    DM --> GD
    GD --> NL
    SQ --> GCC

    SQ --> MP
    QD --> MP
    NL --> MP
    GCC --> MP

    MP --> AD
    AD --> MR
    MR --> CR
    CR --> IE

    IE --> RB
    RB --> TG
    RB --> EM
    RB --> NT
    RB --> DB
    RB --> AU
    RB --> CH
    RB --> G3

    SM -.->|Resume State| EB
    AE -.->|Audit Log| EB
    R9 -.->|Select Provider| MP
    RC -.->|Adjust Workers| TP
```

---

## 2. Executive Brain Sub-Graph (Chi tiết)

```mermaid
graph LR
    subgraph EB["EXECUTIVE BRAIN"]
        direction TB
        
        GOAL[Goal Manager]
        PLAN[Task Planner]
        DECOMP[Task Decomposer]
        SCHED[Scheduler]
        
        subgraph PRE["PRECHECK ENGINE"]
            AH[API Health Check]
            QF[Quota Forecast]
            HV[Hardware Validator]
            TV[Transcript Validator]
            DV[Dependency Validator]
            DR[Dry-Run Validator]
        end
        
        R9[9Router]
        
        subgraph RECOVERY["RECOVERY & HEALING"]
            SE[Self-Healing Engine]
            FB1[Fallback: Gemini]
            FB2[Fallback: Groq]
            FB3[Fallback: OpenRouter]
            FB4[Fallback: Ollama]
        end
        
        STATE[State Manager]
        RES[Resource Controller]
        AUDIT[Audit Engine]
    end

    GOAL --> |"Mục tiêu: Báo cáo tuần"| PLAN
    PLAN --> DECOMP
    DECOMP --> |"Chia thành 4 agents"| SCHED
    SCHED --> PRE
    
    AH --> QF
    QF --> HV
    HV --> TV
    TV --> DV
    DV --> DR
    
    DR --> |PASS| R9
    DR --> |FAIL| SE
    
    R9 --> |Priority 1| FB1
    FB1 --> |Quota Exceeded| FB2
    FB2 --> |Timeout| FB3
    FB3 --> |Rate Limit| FB4
    
    SE --> |Auto-fix| DR
    
    STATE --> |"Save progress<br/>every 10%"| AUDIT
    RES --> |"RAM > 90%<br/>→ Reduce workers"| DECOMP
    AUDIT --> |"Log for<br/>optimization"| GOAL
```

---

## 3. Data Ingestion Pipeline Graph

```mermaid
graph LR
    subgraph INGESTION["AGENT SWARM - PARALLEL INGESTION"]
        direction TB
        
        subgraph YT_AGENT["Agent: YouTube Collector"]
            YT1[YouTube API<br/>List videos]
            YT2[Filter: 7 days]
            YT3[Transcript:<br/>subtitle-first]
            YT4[Fallback:<br/>yt-dlp caption]
            YT5[Fallback:<br/>Groq Whisper]
            YT6[Fallback:<br/>Gemini Audio]
            YT7[Clean:<br/>Regex + Dictionary]
            
            YT1 --> YT2 --> YT3
            YT3 -->|No subtitle| YT4
            YT4 -->|No caption| YT5
            YT5 -->|Whisper fail| YT6
            YT3 --> YT7
            YT4 --> YT7
            YT5 --> YT7
            YT6 --> YT7
        end
        
        subgraph SF_AGENT["Agent: Stock Data Fetcher"]
            SF1[VNStock API<br/>OHLCV]
            SF2[TCBS API<br/>Fundamentals]
            SF3[Calculate<br/>Indicators]
            SF4[Ichimoku<br/>9-17-26-26-26]
            SF5[Ichimoku<br/>65-129-5-2-2]
            SF6[MA/RSI/MACD<br/>Bollinger]
            
            SF1 --> SF3
            SF2 --> SF3
            SF3 --> SF4
            SF3 --> SF5
            SF3 --> SF6
        end
        
        subgraph NC_AGENT["Agent: News Collector"]
            NC1[RSS Feeds<br/>CafeF/VietStock]
            NC2[Filter: 50 articles]
            NC3[Keyword Extract]
            NC4[Sentiment Analysis]
            
            NC1 --> NC2 --> NC3 --> NC4
        end
        
        subgraph WS_AGENT["Agent: Web Scraper"]
            WS1[Target URLs<br/>CTCK Reports]
            WS2[BeautifulSoup<br/>Extract]
            WS3[PDF Reader<br/>pymupdf]
            WS4[Table Extract]
            
            WS1 --> WS2
            WS1 --> WS3 --> WS4
        end
    end
    
    YT7 --> MERGE
    SF4 --> MERGE
    SF5 --> MERGE
    SF6 --> MERGE
    NC4 --> MERGE
    WS2 --> MERGE
    WS4 --> MERGE
    
    MERGE[Data Merge<br/>+ Deduplicate] --> VALID[Validation<br/>Schema Check]
    VALID --> MEGA[Mega Context<br/>JSON/Markdown]
```

---

## 4. Grounding Layer Graph

```mermaid
graph TB
    subgraph GROUNDING["TẦNG 2: GROUNDING & KNOWLEDGE"]
        direction TB
        
        MEGA[Mega Context<br/>from Ingestion]
        
        subgraph LOCAL["Local Storage"]
            SQ[(SQLite<br/>raw_data_json)]
            QD[(Qdrant<br/>Vector DB)]
            GCC[Gemini Context Cache<br/>Prompt + Context]
        end
        
        subgraph CLOUD["Cloud Sync"]
            GD[Google Drive<br/>Folder]
            NL[NotebookLM<br/>Index + Citation]
            NA[NotebookLM<br/>Audio Overview]
        end
        
        MEGA --> SQ
        MEGA --> QD
        MEGA --> GCC
        MEGA --> GD
        
        GD --> NL
        NL --> NA
        
        SQ -->|Query| RETRIEVE[Semantic Retrieve]
        QD -->|Vector Search| RETRIEVE
        NL -->|Source-grounded| RETRIEVE
        GCC -->|Cached Context| RETRIEVE
    end
    
    RETRIEVE --> SYNTHESIS[Adaptive Synthesis]
```

---

## 5. Adaptive Synthesis Graph

```mermaid
graph TB
    subgraph SYNTHESIS["TẦNG 3: ADAPTIVE SYNTHESIS"]
        direction TB
        
        INPUT[Grounded Data<br/>+ Mega Context]
        
        subgraph META["Meta-Prompt 5 Bước"]
            B1["B1: Anomaly Detection<br/>• Count keyword frequency<br/>• Detect volume spikes<br/>• Detect price breakouts"]
            
            B2["B2: Market Regime Classifier<br/>• Uptrend FOMO: >80% bullish, vol up<br/>• Downtrend Panic: sell-off, defense mode<br/>• Sideway Rotation: 50-50 debate, low vol"]
            
            B3["B3: Activate Critique Rules<br/>• Uptrend → Find hidden risks<br/>• Downtrend → Find support & accumulation<br/>• Sideway → Compare asset quality"]
            
            B4["B4: Cross-Reference Experts<br/>• Group Bullish vs Bearish<br/>• Compare price targets<br/>• Detect contradictions<br/>• Identify Blind Spots"]
            
            B5["B5: Generate Report<br/>• Follow user template<br/>• 4-part structure<br/>• Source citations<br/>• Actionable insights"]
        end
        
        INPUT --> B1
        B1 --> B2
        B2 --> B3
        B3 --> B4
        B4 --> B5
        
        B5 --> OUTPUT[Structured Report<br/>Markdown/HTML]
    end
```

---

## 6. Report Builder & Delivery Graph

```mermaid
graph LR
    subgraph BUILDER["REPORT BUILDER"]
        direction TB
        
        TM[Template Manager]
        
        subgraph SECTIONS["Sections (User-defined)"]
            S1[Macro Overview]
            S2[Sector Rotation]
            S3[Stock Cards]
            S4[Technical Chart]
            S5[Sentiment Gauge]
            S6[Insights]
            S7[Watchlist Table]
            S8[Audio Summary]
            S9[3D Graph]
        end
        
        subgraph FORMATS["Output Formats"]
            F1[Text/Markdown]
            F2[HTML Rich]
            F3[Audio MP3]
            F4[Interactive Chart]
            F5[Excel/CSV]
            F6[PDF]
        end
        
        subgraph CHANNELS["Delivery Channels"]
            C1[Telegram]
            C2[Email]
            C3[Notion]
            C4[Dashboard]
        end
    end
    
    TM --> S1
    TM --> S2
    TM --> S3
    TM --> S4
    TM --> S5
    TM --> S6
    TM --> S7
    TM --> S8
    TM --> S9
    
    S1 --> F1
    S1 --> F2
    S2 --> F1
    S2 --> F2
    S3 --> F1
    S3 --> F4
    S4 --> F4
    S5 --> F4
    S6 --> F1
    S6 --> F2
    S7 --> F2
    S7 --> F5
    S8 --> F3
    S9 --> F4
    
    F1 --> C1
    F1 --> C2
    F2 --> C2
    F2 --> C3
    F2 --> C4
    F3 --> C1
    F4 --> C4
    F5 --> C2
    F6 --> C2
```

---

## 7. Recovery & Self-Healing Graph

```mermaid
graph TB
    subgraph RECOVERY["RECOVERY ENGINE"]
        direction TB
        
        ERR[Error Detected]
        
        subgraph ANALYZE["Error Analysis"]
            A1[Identify Source<br/>API / Hardware / Network]
            A2[Classify Error<br/>Timeout / Quota / Crash]
            A3[Check Fallback Chain]
        end
        
        subgraph FALLBACK["Fallback Chain"]
            F1[Gemini<br/>Priority 1]
            F2[Groq<br/>Priority 2]
            F3[OpenRouter<br/>Priority 3]
            F4[Ollama Local<br/>Priority 4]
        end
        
        subgraph ACTIONS["Recovery Actions"]
            R1[Retry with Exponential Backoff]
            R2[Switch Provider]
            R3[Reduce Batch Size]
            R4[Switch to Local Model]
            R5[Alert User & Pause]
        end
        
        ERR --> A1
        A1 --> A2
        A2 --> A3
        
        A3 -->|Gemini fail| F2
        A3 -->|Groq fail| F3
        A3 -->|OpenRouter fail| F4
        A3 -->|Ollama fail| R5
        
        F1 -->|429 Quota| R2
        F1 -->|Timeout| R1
        F2 -->|Timeout| R3
        F3 -->|Rate Limit| R1
        F4 -->|OOM| R3
        
        R1 -->|Success| CONTINUE[Continue Workflow]
        R2 -->|Success| CONTINUE
        R3 -->|Success| CONTINUE
        R4 -->|Success| CONTINUE
        R5 --> PAUSE[Pause & Alert]
        
        CONTINUE --> STATE[Save State<br/>for Resume]
    end
```

---

## 8. n8n Integration Graph

```mermaid
graph TB
    subgraph APP["VNStock AI App (Local)"]
        EB[Executive Brain]
        LOCAL[Local Workers<br/>Python Scripts]
    end
    
    subgraph BRIDGE["n8n Bridge"]
        WH[Webhook Receiver]
        SN[Switch Node]
        
        subgraph N8N_WORKERS["n8n Workers"]
            N1[YouTube Ingestion<br/>Schedule + YouTube API]
            N2[Data Merge<br/>Code Node]
            N3[Delivery Router<br/>Switch Node]
        end
    end
    
    subgraph EXTERNAL["External Services"]
        TG[Telegram Bot]
        EM[Email SMTP]
        NT[Notion API]
    end
    
    EB -->|"Toggle: Local Mode"| LOCAL
    EB -->|"Toggle: n8n Mode"| WH
    
    WH --> SN
    SN -->|"Task: Ingest"| N1
    SN -->|"Task: Merge"| N2
    SN -->|"Task: Deliver"| N3
    
    N1 -->|"Return data"| EB
    N2 -->|"Return merged"| EB
    N3 -->|"Route to"| TG
    N3 -->|"Route to"| EM
    N3 -->|"Route to"| NT
    
    LOCAL -->|"Direct send"| TG
    LOCAL -->|"Direct send"| EM
    LOCAL -->|"Direct send"| NT
```

---

## 9. NotebookLM Integration Graph

```mermaid
graph TB
    subgraph APP["VNStock AI App"]
        COLLECT[Data Collection<br/>Complete]
        TRANSLATE[Gemini Translate<br/>→ Vietnamese]
    end
    
    subgraph GD["Google Drive"]
        FOLDER[Folder:<br/>VNStock_Daily_Intelligence]
        FILES[Markdown Files<br/>per video/source]
    end
    
    subgraph NL["NotebookLM"]
        SYNC[Auto Sync<br/>from Drive]
        INDEX[Index & Vector<br/>Embedding]
        CITE[Citation<br/>Tracking]
        AUDIO[Audio Overview<br/>Podcast 5min]
        QA[Source-grounded<br/>Q&A]
    end
    
    subgraph OUTPUT["App Output"]
        REPORT[Report with<br/>Citations]
        MP3[Audio File<br/>MP3]
        DASH[Dashboard<br/>Interactive]
    end
    
    COLLECT --> TRANSLATE
    TRANSLATE --> FOLDER
    FOLDER --> FILES
    FILES --> SYNC
    SYNC --> INDEX
    INDEX --> CITE
    INDEX --> AUDIO
    INDEX --> QA
    
    CITE -->|"Source citations"| REPORT
    AUDIO -->|"Download MP3"| MP3
    QA -->|"Fact-check"| REPORT
    
    REPORT --> DASH
    MP3 --> DASH
```

---

## 10. Database Entity Relationship Graph

```mermaid
erDiagram
    REPORTS ||--o{ AGENT_TASKS : contains
    REPORTS ||--o{ REPORT_TEMPLATES : uses
    REPORTS ||--o{ CHAT_HISTORY : references
    
    REPORTS {
        INTEGER id PK
        TEXT report_id UK
        TEXT template
        TEXT format
        TEXT sections
        TEXT symbols
        TEXT raw_data_json
        TEXT analysis_result
        TEXT html_path
        TEXT audio_path
        TEXT excel_path
        TEXT market_regime
        TEXT focus_sectors
        BOOLEAN telegram_sent
        BOOLEAN email_sent
        BOOLEAN notion_sent
        BOOLEAN dashboard_saved
        DATETIME created_at
    }
    
    REPORT_TEMPLATES {
        INTEGER id PK
        TEXT template_id UK
        TEXT name
        TEXT sections
        TEXT output_channels
        TEXT time_range
        TEXT sources
        TEXT schedule
        BOOLEAN enabled
        DATETIME created_at
    }
    
    AGENT_TASKS {
        INTEGER id PK
        TEXT task_id UK
        TEXT report_id FK
        TEXT agent_name
        TEXT status
        INTEGER progress
        TEXT input_params
        TEXT output_data
        TEXT error_message
        DATETIME started_at
        DATETIME completed_at
        DATETIME created_at
    }
    
    CHAT_HISTORY {
        INTEGER id PK
        TEXT session_id
        TEXT role
        TEXT content
        TEXT intent
        TEXT metadata
        DATETIME created_at
    }
    
    SETTINGS {
        TEXT key PK
        TEXT value
        DATETIME updated_at
    }
    
    API_KEYS {
        INTEGER id PK
        TEXT provider UK
        TEXT api_key
        TEXT status
        INTEGER latency_ms
        DATETIME last_tested
        DATETIME created_at
    }
```

---

## 11. Component Dependency Graph

```mermaid
graph TB
    subgraph FRONTEND["Frontend (React + Vite)"]
        SYS[System Config Tab]
        MOD[Module Registry Tab]
        WF[Workflow Graph Tab]
        EB_UI[Executive Brain Tab]
        HC[Health Check Tab]
        OS[Output Settings Tab]
        RB[Report Builder Tab NEW]
        CP[Data Collection Panel NEW]
        CH[Chart Viewer NEW]
    end
    
    subgraph BACKEND["Backend (Node.js + Express)"]
        API[API Router]
        
        subgraph SERVICES["Services"]
            S1[Chat Service]
            S2[Report Service NEW]
            S3[Agent Service NEW]
            S4[Precheck Service NEW]
            S5[Delivery Service NEW]
            S6[Sync Service]
        end
        
        subgraph WORKERS["Workers"]
            W1[YouTube Worker]
            W2[Stock Worker]
            W3[News Worker]
            W4[Analysis Worker]
        end
    end
    
    subgraph EXTERNAL["External"]
        GEM[Gemini API]
        GRO[Groq API]
        OR[OpenRouter]
        YT[YouTube API]
        VS[VNStock API]
        TG[Telegram API]
        EM[Email SMTP]
        NT[Notion API]
        N8N[n8n Webhook]
        NL[NotebookLM]
    end
    
    SYS --> API
    MOD --> API
    WF --> API
    EB_UI --> API
    HC --> API
    OS --> API
    RB --> API
    CP --> API
    CH --> API
    
    API --> S1
    API --> S2
    API --> S3
    API --> S4
    API --> S5
    API --> S6
    
    S2 --> W1
    S2 --> W2
    S2 --> W3
    S2 --> W4
    
    S3 --> W1
    S3 --> W2
    S3 --> W3
    
    S4 --> GEM
    S4 --> GRO
    
    S5 --> TG
    S5 --> EM
    S5 --> NT
    
    W1 --> YT
    W2 --> VS
    W3 --> VS
    W4 --> GEM
    W4 --> GRO
    W4 --> OR
    
    S6 --> N8N
    S2 --> NL
```

---

## 12. Runtime Flow Graph (Sequence)

```mermaid
sequenceDiagram
    actor User
    participant App as VNStock AI App
    participant EB as Executive Brain
    participant PE as Precheck Engine
    participant AS as Agent Swarm
    participant DB as SQLite/Qdrant
    participant AI as Gemini/Groq
    participant NL as NotebookLM
    participant RB as Report Builder
    participant TG as Telegram
    participant EM as Email

    User->>App: Chọn mẫu "Báo cáo tuần"
    User->>App: Click "Run Report"
    
    App->>EB: Gửi mục tiêu
    EB->>PE: Chạy Precheck
    
    PE->>PE: Kiểm tra API Health
    PE->>PE: Kiểm tra Quota
    PE->>PE: Kiểm tra Hardware
    PE->>EB: PASS
    
    EB->>AS: Khởi động Agent Swarm
    
    par Parallel Ingestion
        AS->>AS: YouTube Collector (29 kênh)
        AS->>AS: Stock Data Fetcher
        AS->>AS: RSS News Collector
    end
    
    AS->>DB: Lưu raw data
    DB->>NL: Đồng bộ (optional)
    
    EB->>AI: Gửi Mega Context + Meta-Prompt
    AI->>AI: B1: Anomaly Detection
    AI->>AI: B2: Regime Classification
    AI->>AI: B3: Activate Critique Rules
    AI->>AI: B4: Cross-Reference
    AI->>AI: B5: Generate Report
    AI->>EB: Trả báo cáo structured
    
    EB->>RB: Render theo mẫu
    RB->>RB: Tạo HTML + Charts + Audio
    
    RB->>TG: Gửi Telegram (text + audio)
    RB->>EM: Gửi Email (HTML + Excel)
    RB->>App: Hiển thị Dashboard
    
    App->>User: Báo cáo sẵn sàng!
```

---

## 13. File Structure Graph

```mermaid
graph TD
    subgraph PROJECT["VNStock AI v3.0 Project"]
        README[README.md]
        
        subgraph DOCS["docs/upgrade-v3/"]
            D1[00_OVERVIEW.md]
            D2[01_SYSTEM_GRAPH.md]
            D3[02_UPGRADE_ROADMAP.md]
            D4[03_ADVANCED_FEATURES.md]
        end
        
        subgraph SRC["src/ (Frontend)"]
            S_APP[App.tsx]
            S_SEC[sections/]
            S_COM[components/]
            S_HOK[hooks/]
            S_SRV[services/]
            S_TYP[types/]
            
            S_SEC --> S_RB[ReportBuilder.tsx NEW]
            S_SEC --> S_CP[CollectionPanel.tsx NEW]
            S_SEC --> S_CH[ChartViewer.tsx NEW]
            S_SEC --> S_AU[AudioPlayer.tsx NEW]
            S_SEC --> S_3D[Graph3D.tsx NEW]
        end
        
        subgraph BACK["local-backend/"]
            B_SRV[server.js]
            B_DB[db.js]
            B_SYNC[sync.js]
            
            subgraph SCRIPTS["scripts/"]
                SC_YT[youtube_analyzer.py]
                SC_ST[stock_fetcher.py NEW]
                SC_NL[notebooklm_sync.py NEW]
                SC_TTS[tts_generator.py NEW]
                SC_CH[chart_generator.py NEW]
            end
            
            subgraph WORKERS["workers/"]
                WK_YT[youtube_worker.js NEW]
                WK_ST[stock_worker.js NEW]
                WK_NL[news_worker.js NEW]
                WK_AN[analysis_worker.js NEW]
            end
        end
        
        subgraph CONFIG["config/"]
            CFG_API[api_registry.json NEW]
            CFG_TMPL[report_templates.json NEW]
            CFG_IND[indicators_config.json NEW]
        end
    end
```

---

*File này sử dụng Mermaid syntax để mô tả graph. Có thể render bằng bất kỳ Mermaid viewer nào (GitHub, Notion, VS Code extension, hoặc mermaid.live).*
