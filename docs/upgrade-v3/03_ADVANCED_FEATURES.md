# VNStock AI v3.0 — Tính năng nâng cao & Phân tích chuyên sâu

> **Mục đích**: Phân tích chi tiết 3 yêu cầu nâng cấp bổ sung:
> 1. Tận dụng NotebookLM cho báo cáo âm thanh (Audio Overview) và trình chiếu
> 2. Đảm bảo báo cáo chính xác, dùng đúng dữ liệu từ nguồn chỉ định (Source-grounded)
> 3. Bổ sung 10 dạng chỉ báo kỹ thuật, bắt buộc có Ichimoku 9-17-26-26-26 và 65-129-5-2-2
> **Ngày cập nhật**: 2026-06-07

---

## Phần 1: NotebookLM — Audio Overview & Trình chiếu

### 1.1. Bản chất NotebookLM trong hệ thống

NotebookLM không phải là AI phân tích thị trường. Nó là **"Môi trường neo giữ tri thức"** (Grounded Knowledge Sandbox):

| Vai trò | Chức năng | Lợi ích cho VNStock AI |
|---------|----------|------------------------|
| **Grounding** | Index & vector embedding dữ liệu đầu vào | 0% hallucination — mọi phân tích bám sát nguồn |
| **Citation** | Tự động trích dẫn nguồn cho mọi luận điểm | Báo cáo có nguồn rõ ràng, kiểm chứng được |
| **Audio Overview** | Tạo podcast 2 MC ảo đối thoại từ dữ liệu | Người dùng nghe báo cáo khi lái xe, đánh răng |
| **Cross-reference** | Đối chiếu chéo nguồn A vs nguồn B | Phát hiện mâu thuẫn giữa các chuyên gia |
| **Q&A** | Trả lời câu hỏi chỉ dựa trên dữ liệu đã index | Không bịa đặt, không lấy kiến thức ngoài |

### 1.2. Luồng tích hợp NotebookLM chi tiết

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BƯỚC 1: THU THẬP & CHUẨN BỊ                                            │
│  • Agent Swarm thu thập xong: YouTube transcript + Stock data + News    │
│  • Gemini sơ chế: sửa lỗi chính tả, dịch tiếng Việt, tách đoạn văn bản   │
│  • Tạo file Markdown cho từng nguồn:                                   │
│    - youtube_dnse_20250607.md                                           │
│    - youtube_ssi_20250607.md                                            │
│    - stock_vnindex_20250607.md                                          │
│    - news_cafef_20250607.md                                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  BƯỚC 2: ĐẨY LÊN GOOGLE DRIVE                                          │
│  • Tạo folder: "VNStock_Daily_Intelligence"                             │
│  • Upload tất cả file Markdown                                          │
│  • Cấu trúc:                                                          │
│    VNStock_Daily_Intelligence/                                        │
│    ├── 2026-06-07/                                                      │
│    │   ├── youtube/                                                     │
│    │   │   ├── dnse_video_abc123.md                                     │
│    │   │   ├── ssi_video_def456.md                                      │
│    │   │   └── ... (29 files)                                           │
│    │   ├── stock/                                                       │
│    │   │   ├── vnindex_ohlcv.md                                       │
│    │   │   ├── fpt_analysis.md                                          │
│    │   │   └── ...                                                      │
│    │   └── news/                                                        │
│    │       ├── cafef_001.md                                           │
│    │       └── ...                                                      │
│    └── 2026-06-06/                                                      │
│        └── ...                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  BƯỚC 3: NOTEBOOKLM TỰ ĐỘNG INDEX                                     │
│  • NotebookLM đã được liên kết với folder Google Drive                │
│  • Tự động sync khi có file mới                                        │
│  • Tạo vector embedding cho từng đoạn văn bản                         │
│  • Lập chỉ mục citation: [Tên Kênh - Tiêu đề Video - Timestamp]       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  BƯỚC 4: TẠO AUDIO OVERVIEW                                           │
│  • NotebookLM tự động tạo podcast khi có đủ dữ liệu (thường 5-10 phút)│
│  • 2 MC ảo đối thoại:                                                   │
│    - MC 1: Tóm tắt tình hình chung                                    │
│    - MC 2: Đặt câu hỏi phản biện, bóc tách nhân quả                   │
│  • Nội dung hoàn toàn dựa trên dữ liệu đã index                       │
│  • Định dạng: MP3, thời lượng 5-7 phút                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  BƯỚC 5: TẢI AUDIO VỀ APP                                             │
│  • App poll hoặc nhận webhook khi Audio Overview sẵn sàng              │
│  • Download MP3 về local: local-backend/data/audio/                     │
│  • Lưu đường dẫn vào SQLite: reports.audio_path                       │
│  • Hiển thị trong Dashboard: Audio Player                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  BƯỚC 6: GỬI KÈM TRONG BÁO CÁO                                        │
│  • Telegram: Gửi text tóm tắt + file MP3 đính kèm                       │
│  • Email: HTML báo cáo + MP3 attachment                                │
│  • Dashboard: Audio Player nhúng + transcript sync                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.3. Audio Overview — Chi tiết kỹ thuật

#### Cách NotebookLM tạo Audio Overview

NotebookLM sử dụng **Gemini TTS (Text-to-Speech)** với kỹ thuật đặc biệt:

1. **Script Generation**: Gemini viết kịch bản đối thoại 2 người từ dữ liệu đã index
2. **Voice Synthesis**: Google Cloud TTS với 2 giọng khác nhau (giọng nam + giọng nữ)
3. **Prosody Control**: Điều chỉnh ngữ điệu, tốc độ, pause để giống podcast thật
4. **Output**: File MP3, stereo, 128kbps

#### Fallback khi NotebookLM không có Audio Overview

| Trường hợp | Giải pháp |
|-----------|-----------|
| NotebookLM chưa tạo xong | Dùng **Google Cloud TTS** trực tiếp: Gemini viết script → TTS tạo MP3 |
| NotebookLM không hỗ trợ tiếng Việt tốt | Dùng **Gemini TTS** hoặc **Zalo AI TTS** (miễn phí cho tiếng Việt) |
| Dữ liệu quá ít để tạo podcast | Tạo **Audio Summary ngắn** (1-2 phút) thay vì Overview đầy đủ |
| Không có Google Workspace | Dùng **local TTS** (pyttsx3 / edge-tts) với script từ Gemini |

#### Cấu hình trong app

```json
// local-backend/config/notebooklm_config.json
{
  "enabled": true,
  "google_drive_folder_id": "1A2B3C4D5E6F...",
  "notebook_id": "notebook-xxx",
  "audio_overview": {
    "auto_generate": true,
    "wait_timeout_minutes": 15,
    "fallback_tts": "google_cloud",
    "voice_male": "vi-VN-Neural2-D",
    "voice_female": "vi-VN-Neural2-A",
    "max_duration_minutes": 7
  },
  "sync": {
    "mode": "auto",  // auto | manual
    "schedule": "after_ingestion",  // sau khi thu thập xong
    "retry_count": 3
  }
}
```

### 1.4. Trình chiếu (Presentation Mode)

#### Khái niệm

"Trình chiếu" = Chuyển báo cáo thành dạng **slide-by-slide** có thể:
- Chiếu trên màn hình lớn
- Chia sẻ qua link
- Export thành PPTX hoặc PDF trình chiếu

#### Cách thực hiện

**Cách 1: NotebookLM → Slides (nếu có tính năng)**
- NotebookLM có thể tạo "Study Guide" hoặc "FAQ" từ dữ liệu
- Chuyển thành slides bằng công cụ bên thứ 3

**Cách 2: App tự tạo Slides**
```
Báo cáo 4 phần → Tách thành 8-12 slides:

Slide 1: Title + Ngày + Trạng thái thị trường
Slide 2: Macro Overview (biểu đồ + bullet points)
Slide 3: Nhân quả chéo (sơ đồ flow)
Slide 4: Trọng tài chuyên gia (Bullish vs Bearish table)
Slide 5: Ngành tiêu điểm (Sector map)
Slide 6: Cổ phiếu chi tiết (Cards với chart mini)
Slide 7: Technical Chart (nến + Ichimoku)
Slide 8: Sentiment Gauge (biểu đồ đo)
Slide 9: Insights & Blind Spots (warning boxes)
Slide 10: Watchlist Table (ma trận hành động)
Slide 11: Kịch bản hành động (2 scenarios)
Slide 12: Audio QR code + Link dashboard
```

**Cách 3: Export PPTX**
- Dùng thư viện `pptxgenjs` (client-side) hoặc `python-pptx` (server-side)
- Tạo file .pptx từ báo cáo structured
- Người dùng download và chỉnh sửa thêm

#### UI trong app

```tsx
// Tab Report Builder → Nút "Presentation Mode"
// Hoặc section mới "Presentation Viewer"

<PresentationViewer>
  <SlideNavigation>
    <Button>← Previous</Button>
    <Progress>Slide 3 / 12</Progress>
    <Button>Next →</Button>
  </SlideNavigation>
  
  <SlideContent>
    {/* Render từng slide dựa trên report sections */}
    {/* Mỗi slide = 1 section hoặc 1 phần của section */}
  </SlideContent>
  
  <SlideControls>
    <Button>▶ Auto-play (5s/slide)</Button>
    <Button>⛶ Fullscreen</Button>
    <Button>💾 Export PPTX</Button>
    <Button>🔗 Share Link</Button>
  </SlideControls>
</PresentationViewer>
```

### 1.5. Tích hợp NotebookLM — Hạn chế & Giải pháp

| Hạn chế | Mức độ | Giải pháp |
|---------|--------|-----------|
| Không có API chính thức | Cao | Dùng Google Drive API để upload. Poll hoặc manual trigger trong NotebookLM UI. Hoặc dùng **Gemini Context Caching** thay thế hoàn toàn |
| Audio Overview chỉ tạo khi đủ dữ liệu | Trung bình | Fallback: Google Cloud TTS hoặc Zalo AI TTS |
| Chỉ hỗ trợ tiếng Anh tốt nhất | Trung bình | Dùng Gemini dịch transcript sang tiếng Việt trước khi đẩy lên. Hoặc dùng TTS tiếng Việt riêng |
| Cần Google Workspace | Trung bình | Cung cấp hướng dẫn cấu hình. Hoặc dùng **local hybrid** (SQLite + Qdrant) thay thế |
| Thời gian sync không real-time | Thấp | Chấp nhận delay 5-10 phút. Hoặc dùng manual sync button |

---

## Phần 2: Báo cáo chính xác — Source-Grounded & Data Integrity

### 2.1. Vấn đề: Tại sao báo cáo AI thường sai?

| Lỗi | Nguyên nhân | Hệ quả |
|-----|------------|--------|
| **Hallucination** | AI tự bịa đặt số liệu, tên công ty, vùng giá | Người dùng đưa ra quyết định sai lầm |
| **Stale data** | Dùng dữ liệu cũ, không cập nhật theo thị trường | Phân tích lạc hậu |
| **Wrong source** | Trích dẫn nguồn không đúng hoặc không có nguồn | Không kiểm chứng được |
| **Mixed signals** | Gộp dữ liệu từ nhiều ngày, không phân biệt | Kết luận mơ hồ |
| **Missing context** | Thiếu dữ liệu vĩ mô, chỉ phân tích micro | Nhìn nhận phiến diện |

### 2.2. Giải pháp: Source-Grounded Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  NGUYÊN TẮC 1: MỌI LUẬN ĐIỂM PHẢI CÓ NGUỒN                             │
│  • Format citation: [Tên Kênh - Tiêu đề Video - Ngày DD/MM/YYYY]        │
│  • Ví dụ: [DNSE - Phân tích VNINDEX tuần 23 - 07/06/2026]               │
│  • Nếu không có nguồn cụ thể → ghi rõ "Không tìm thấy nguồn xác nhận"   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  NGUYÊN TẮC 2: SỐ LIỆU PHẢI TỪ API THỰC, KHÔNG TỪ "KIẾN THỨC" AI       │
│  • Giá cổ phiếu: Từ VNStock API / TCBS (real-time hoặc EOD)             │
│  • P/E, P/B: Từ báo cáo tài chính hoặc SSI iBoard                      │
│  • Volume: Từ sàn HOSE/HNX (chính thức)                                │
│  • Chỉ báo kỹ thuật: Tính từ OHLCV thực, không dùng giá trị "ước tính"  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  NGUYÊN TẮC 3: PHÂN BIỆT RÕ DỮ LIỆU THÔ VÀ PHÂN TÍCH AI                │
│  • Dữ liệu thô (Raw): Lưu riêng, không chỉnh sửa                       │
│  • Phân tích AI (Analysis): Đánh dấu rõ là "suy luận của AI"            │
│  • Người dùng có thể xem raw data để đối chiếu                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  NGUYÊN TẮC 4: VALIDATION LAYER GIỮA THU THẬP VÀ PHÂN TÍCH              │
│  • Transcript Validator: Kiểm tra length vs video duration             │
│  • Stock Data Validator: Kiểm tra OHLCV hợp lý (không có giá âm)        │
│  • Cross-Validator: So sánh dữ liệu từ 2 nguồn khác nhau                 │
│  • Nếu conflict → flag để AI xử lý hoặc bỏ qua                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3. Cấu trúc dữ liệu đảm bảo tính chính xác

#### Raw Data Schema (Lưu riêng, không sửa)

```json
{
  "report_id": "rpt-20250607-001",
  "raw_data": {
    "youtube": [
      {
        "source": {
          "channel": "DNSE",
          "video_id": "abc123",
          "title": "Phân tích VNINDEX tuần 23",
          "published_at": "2026-06-07T08:00:00Z",
          "url": "https://youtube.com/watch?v=abc123"
        },
        "transcript": {
          "method": "subtitle",  // subtitle | yt-dlp | whisper | gemini_audio
          "language": "vi",
          "text": "...",
          "length_chars": 15420,
          "validated": true,
          "validation_note": "OK - length matches 45min video"
        }
      }
    ],
    "stock": [
      {
        "source": {
          "api": "vnstock",
          "symbol": "FPT",
          "timeframe": "1d",
          "date_range": "2026-05-31 to 2026-06-07"
        },
        "ohlcv": [
          {"date": "2026-06-02", "open": 102.5, "high": 104.0, "low": 101.8, "close": 103.2, "volume": 1250000}
        ],
        "indicators": {
          "ma20": 101.3,
          "rsi14": 62.5,
          "validated": true
        }
      }
    ],
    "news": [
      {
        "source": {
          "feed": "CafeF",
          "url": "https://cafef.vn/...",
          "published_at": "2026-06-07T09:30:00Z"
        },
        "title": "...",
        "content": "...",
        "keywords": ["VNINDEX", "FPT", "tăng trưởng"],
        "sentiment": "positive"
      }
    ]
  },
  "validation_summary": {
    "total_sources": 85,
    "validated": 83,
    "failed": 2,
    "failed_sources": [
      {"source": "youtube_xyz", "reason": "transcript_too_short", "action": "excluded"}
    ]
  }
}
```

#### Analysis Result Schema (Đánh dấu rõ nguồn)

```json
{
  "report_id": "rpt-20250607-001",
  "analysis": {
    "part1_macro": {
      "market_regime": {
        "value": "Uptrend FOMO",
        "confidence": 0.85,
        "basis": "volume_increase + expert_consensus",
        "sources": ["youtube_dnse_abc123", "youtube_ssi_def456"]
      },
      "claims": [
        {
          "statement": "VNINDEX tăng 2.3% trong tuần qua",
          "type": "fact",  // fact | inference | opinion
          "verified": true,
          "source": "stock_vnindex_ohlcv",
          "source_type": "api"  // api | transcript | news
        },
        {
          "statement": "Ngành BĐS là ngành tiêu điểm của tuần",
          "type": "inference",
          "confidence": 0.78,
          "verified": "partial",
          "sources": ["youtube_dnse_abc123", "youtube_vndirect_ghi789"],
          "source_type": "transcript",
          "note": "20/29 kênh nhắc đến BĐS, nhưng chưa có số liệu volume ngành"
        }
      ]
    }
  }
}
```

### 2.4. Transcript Validator — Chi tiết

```javascript
class TranscriptValidator {
  validate(video, transcript) {
    const checks = {
      // 1. Length check
      lengthRatio: transcript.length / video.duration_minutes,
      // Video 45 phút → transcript ít nhất 3000-5000 từ
      // Nếu < 100 từ → lỗi nghiêm trọng
      
      // 2. Language check
      language: detectLanguage(transcript),
      // Phải là tiếng Việt hoặc tiếng Anh
      
      // 3. Content check
      hasStockTerms: checkStockKeywords(transcript),
      // Phải có ít nhất 5 từ khóa chứng khoán
      
      // 4. Structure check
      hasParagraphs: transcript.includes('\n\n'),
      // Không phải 1 đoạn dài liên tục
    };
    
    const score = calculateScore(checks);
    
    if (score < 0.5) {
      return {
        valid: false,
        reason: 'transcript_quality_too_low',
        action: 'fallback_to_whisper',
        checks
      };
    }
    
    return { valid: true, score, checks };
  }
}
```

### 2.5. UI đảm bảo tính chính xác

```tsx
// Trong báo cáo Dashboard, mỗi luận điểm có:
<ClaimCard>
  <Statement>VNINDEX tăng 2.3% trong tuần qua</Statement>
  <VerificationBadge type="fact" verified={true}>
    ✓ Đã xác minh
  </VerificationBadge>
  <SourceLink href="/raw-data/stock/vnindex">
    Nguồn: VNStock API
  </SourceLink>
  <RawDataPreview>
    {/* Hiển thị 2-3 dòng raw data */}
    OHLCV: Open 1,245.30 → Close 1,273.80 (+2.29%)
  </RawDataPreview>
</ClaimCard>

<ClaimCard>
  <Statement>Ngành BĐS sẽ dẫn dắt thị trường tháng 6</Statement>
  <VerificationBadge type="inference" confidence={0.65}>
    ⚠ Suy luận AI (độ tin cậy 65%)
  </VerificationBadge>
  <SourceLink href="/raw-data/youtube/dnse_abc123">
    Nguồn: DNSE - Phân tích VNINDEX tuần 23
  </SourceLink>
  <ExpertDebate>
    {/* Hiển thị ý kiến trái chiều */}
    Bullish: DNSE, SSI (2 kênh)
    Bearish: Fiin (1 kênh)
  </ExpertDebate>
</ClaimCard>
```

### 2.6. Cross-Validation giữa nhiều nguồn

```javascript
class CrossValidator {
  async validateStockPrice(symbol, sources) {
    // Lấy giá từ 2-3 API khác nhau
    const prices = await Promise.all([
      vnstockAPI.getPrice(symbol),
      tcbsAPI.getPrice(symbol),
      ssiAPI.getPrice(symbol)
    ]);
    
    // So sánh
    const avg = average(prices);
    const variance = max(prices) - min(prices);
    
    if (variance / avg > 0.01) {  // Sai lệch > 1%
      return {
        valid: false,
        reason: 'price_discrepancy',
        prices,
        recommendation: 'use_majority_vote'
      };
    }
    
    return { valid: true, price: avg, sources };
  }
}
```

---

## Phần 3: 10 Chỉ báo kỹ thuật — Chi tiết công thức & cấu hình

### 3.1. Danh sách 10 chỉ báo

| # | Chỉ báo | Tham số | Mục đích | Khung thời gian |
|---|---------|---------|----------|----------------|
| 1 | **MA** (Simple Moving Average) | 5, 20, 50 | Xác định xu hướng ngắn/trung/dài hạn | Ngày |
| 2 | **EMA** (Exponential MA) | 12, 26 | Nhạy hơn MA, dùng cho MACD | Ngày |
| 3 | **RSI** (Relative Strength Index) | 14 | Đo lường độ mạnh/yếu, overbought/oversold | Ngày |
| 4 | **MACD** | 12, 26, 9 | Xác định động lượng và đảo chiều | Ngày |
| 5 | **Bollinger Bands** | 20, 2 | Đo lường biến động, vùng giá bất thường | Ngày |
| 6 | **Ichimoku Standard** | **9, 17, 26, 26, 26** | Bản đồ xu hướng toàn diện (khung ngày) | Ngày |
| 7 | **Ichimoku Long-term** | **65, 129, 5, 2, 2** | Ichimoku cho khung tuần/tháng | Tuần/Tháng |
| 8 | **Volume MA** | 20 | Xác nhận xu hướng bằng khối lượng | Ngày |
| 9 | **OBV** (On-Balance Volume) | - | Dòng tiền tích lũy | Ngày |
| 10 | **Stochastic** | 14, 3, 3 | Đo lường động lượng so với vùng giá | Ngày |

### 3.2. Công thức chi tiết

#### 1. MA (Simple Moving Average)

```
MA(n) = (P1 + P2 + ... + Pn) / n

Ví dụ MA(5):
Ngày 1: 100
Ngày 2: 102
Ngày 3: 101
Ngày 4: 105
Ngày 5: 103
MA(5) = (100 + 102 + 101 + 105 + 103) / 5 = 102.2
```

#### 2. EMA (Exponential Moving Average)

```
EMA(n) = Price(t) × k + EMA(yesterday) × (1 - k)

Trong đó:
k = 2 / (n + 1)  // smoothing factor

EMA(12): k = 2 / 13 = 0.1538
EMA(26): k = 2 / 27 = 0.0741
```

#### 3. RSI (Relative Strength Index)

```
RSI = 100 - (100 / (1 + RS))

RS = Average Gain / Average Loss

Bước tính:
1. Tính thay đổi giá mỗi ngày: Change = Close(t) - Close(t-1)
2. Tách thành Gain (Change > 0) và Loss (Change < 0, lấy abs)
3. Average Gain = SMA của Gain (14 ngày)
4. Average Loss = SMA của Loss (14 ngày)
5. RS = Average Gain / Average Loss
6. RSI = 100 - (100 / (1 + RS))

Giải thích:
- RSI > 70: Overbought (quá mua)
- RSI < 30: Oversold (quá bán)
- RSI 50: Trung tính
```

#### 4. MACD (Moving Average Convergence Divergence)

```
MACD Line = EMA(12) - EMA(26)
Signal Line = EMA(9) của MACD Line
Histogram = MACD Line - Signal Line

Giải thích:
- MACD cắt Signal từ dưới lên: Tín hiệu mua
- MACD cắt Signal từ trên xuống: Tín hiệu bán
- Histogram dương và tăng: Động lượng tăng giá mạnh
- Histogram âm và giảm: Động lượng giảm giá mạnh
```

#### 5. Bollinger Bands

```
Middle Band = SMA(20)
Upper Band = SMA(20) + (2 × StandardDeviation(20))
Lower Band = SMA(20) - (2 × StandardDeviation(20))

Giải thích:
- Giá chạm Upper Band: Có thể quá mua, chuẩn bị điều chỉnh
- Giá chạm Lower Band: Có thể quá bán, chuẩn bị hồi phục
- Band thu hẹp (Squeeze): Chuẩn bị breakout
- Band mở rộng: Biến động mạnh
```

#### 6. Ichimoku Standard — **9, 17, 26, 26, 26**

```
Ichimoku gồm 5 đường:

1. Tenkan-sen (Đường chuyển đổi) = (Highest High + Lowest Low) / 2 trong 9 phiên
   → Đường ngắn hạn, nhạy với biến động giá

2. Kijun-sen (Đường chuẩn) = (Highest High + Lowest Low) / 2 trong 17 phiên
   → Đường trung hạn, xác định xu hướng chính

3. Senkou Span A (Đám mây A) = (Tenkan + Kijun) / 2, dịch chuyển 26 phiên về phía trước
   → Biên trên của đám mây

4. Senkou Span B (Đám mây B) = (Highest High + Lowest Low) / 2 trong 26 phiên, dịch chuyển 26 phiên về phía trước
   → Biên dưới của đám mây

5. Chikou Span (Đường trễ) = Giá đóng cửa hiện tại, dịch chuyển 26 phiên về phía sau
   → Xác nhận tín hiệu

Cấu hình: 9, 17, 26, 26, 26
- Tenkan = 9
- Kijun = 17
- Senkou B = 26
- Senkou Span (dịch) = 26
- Chikou Span (dịch) = 26

Giải thích tín hiệu:
- Giá trên đám mây: Xu hướng tăng
- Giá dưới đám mây: Xu hướng giảm
- Giá trong đám mây: Sideway
- Tenkan cắt Kijun từ dưới lên: Tín hiệu mua
- Tenkan cắt Kijun từ trên xuống: Tín hiệu bán
- Chikou Span trên giá 26 phiên trước: Xác nhận tăng
```

#### 7. Ichimoku Long-term — **65, 129, 5, 2, 2**

```
Cấu hình cho khung tuần/tháng (dài hạn):

1. Tenkan-sen = (HH + LL) / 2 trong 65 phiên
2. Kijun-sen = (HH + LL) / 2 trong 129 phiên
3. Senkou Span A = (Tenkan + Kijun) / 2, dịch 5 phiên về trước
4. Senkou Span B = (HH + LL) / 2 trong 2 phiên, dịch 2 phiên về trước
5. Chikou Span = Giá đóng cửa, dịch 2 phiên về sau

Cấu hình: 65, 129, 5, 2, 2
- Tenkan = 65 (≈ 3 tháng)
- Kijun = 129 (≈ 6 tháng)
- Senkou B = 5
- Senkou Span (dịch) = 2
- Chikou Span (dịch) = 2

Mục đích:
- Phù hợp phân tích xu hướng dài hạn (3-6 tháng)
- Ít nhiễu hơn Ichimoku chuẩn
- Dùng cho đầu tư trung/dài hạn
```

#### 8. Volume MA (Volume Moving Average)

```
Volume MA(20) = (Vol1 + Vol2 + ... + Vol20) / 20

Giải thích:
- Volume > Volume MA: Xác nhận xu hướng mạnh
- Volume < Volume MA: Xu hướng yếu, có thể đảo chiều
- Volume đột biến (gấp 2-3 lần MA): Tin tức lớn, breakout
```

#### 9. OBV (On-Balance Volume)

```
Nếu Close(t) > Close(t-1): OBV(t) = OBV(t-1) + Volume(t)
Nếu Close(t) < Close(t-1): OBV(t) = OBV(t-1) - Volume(t)
Nếu Close(t) = Close(t-1): OBV(t) = OBV(t-1)

Giải thích:
- OBV tăng: Dòng tiền vào, xác nhận tăng giá
- OBV giảm: Dòng tiền ra, xác nhận giảm giá
- OBV diverge với giá: Cảnh báo đảo chiều
  (Giá tăng nhưng OBV giảm → Tăng yếu, sắp đảo chiều)
```

#### 10. Stochastic Oscillator

```
%K = (Close - Lowest Low) / (Highest High - Lowest Low) × 100
%D = SMA(3) của %K

Trong đó:
- Lowest Low = Giá thấp nhất trong 14 phiên
- Highest High = Giá cao nhất trong 14 phiên

Giải thích:
- %K > 80: Overbought
- %K < 20: Oversold
- %K cắt %D từ dưới lên: Tín hiệu mua
- %K cắt %D từ trên xuống: Tín hiệu bán
```

### 3.3. Cấu hình indicators trong app

```json
// local-backend/config/indicators_config.json
{
  "indicators": {
    "ma": {
      "enabled": true,
      "periods": [5, 20, 50],
      "colors": ["#FF6B6B", "#4ECDC4", "#45B7D1"],
      "linewidth": 1.5
    },
    "ema": {
      "enabled": true,
      "periods": [12, 26],
      "colors": ["#96CEB4", "#FFEAA7"],
      "linewidth": 1.5
    },
    "rsi": {
      "enabled": true,
      "period": 14,
      "overbought": 70,
      "oversold": 30,
      "color": "#DDA0DD",
      "panel": "below"  // Hiển thị dưới chart chính
    },
    "macd": {
      "enabled": true,
      "fast": 12,
      "slow": 26,
      "signal": 9,
      "colors": {
        "macd": "#00CED1",
        "signal": "#FF6347",
        "histogram_positive": "#26A69A",
        "histogram_negative": "#EF5350"
      },
      "panel": "below"
    },
    "bollinger": {
      "enabled": true,
      "period": 20,
      "std_dev": 2,
      "colors": {
        "upper": "#FF9800",
        "middle": "#9E9E9E",
        "lower": "#FF9800"
      },
      "fill": "rgba(255, 152, 0, 0.1)"
    },
    "ichimoku_standard": {
      "enabled": true,
      "name": "Ichimoku Standard",
      "params": {
        "tenkan": 9,
        "kijun": 17,
        "senkou_b": 26,
        "senkou_span": 26,
        "chikou_span": 26
      },
      "colors": {
        "tenkan": "#FF6B6B",
        "kijun": "#4ECDC4",
        "senkou_a": "rgba(78, 205, 196, 0.2)",
        "senkou_b": "rgba(255, 107, 107, 0.2)",
        "chikou": "#9B59B6"
      },
      "cloud_fill": {
        "bullish": "rgba(78, 205, 196, 0.2)",
        "bearish": "rgba(255, 107, 107, 0.2)"
      }
    },
    "ichimoku_longterm": {
      "enabled": true,
      "name": "Ichimoku Long-term",
      "params": {
        "tenkan": 65,
        "kijun": 129,
        "senkou_b": 5,
        "senkou_span": 2,
        "chikou_span": 2
      },
      "colors": {
        "tenkan": "#E74C3C",
        "kijun": "#3498DB",
        "senkou_a": "rgba(52, 152, 219, 0.2)",
        "senkou_b": "rgba(231, 76, 60, 0.2)",
        "chikou": "#8E44AD"
      },
      "timeframe": "weekly",  // Chỉ hiển thị ở khung tuần/tháng
      "cloud_fill": {
        "bullish": "rgba(52, 152, 219, 0.2)",
        "bearish": "rgba(231, 76, 60, 0.2)"
      }
    },
    "volume_ma": {
      "enabled": true,
      "period": 20,
      "color": "#FFA726",
      "panel": "below_volume"
    },
    "obv": {
      "enabled": true,
      "color": "#AB47BC",
      "panel": "below"
    },
    "stochastic": {
      "enabled": true,
      "k_period": 14,
      "d_period": 3,
      "smooth": 3,
      "colors": {
        "k": "#5C6BC0",
        "d": "#FF7043"
      },
      "overbought": 80,
      "oversold": 20,
      "panel": "below"
    }
  },
  "panels": {
    "main": {
      "height_ratio": 0.5,
      "indicators": ["ma", "ema", "bollinger", "ichimoku_standard", "ichimoku_longterm"]
    },
    "volume": {
      "height_ratio": 0.15,
      "indicators": ["volume_ma"]
    },
    "indicator_1": {
      "height_ratio": 0.15,
      "indicators": ["rsi", "stochastic"]
    },
    "indicator_2": {
      "height_ratio": 0.2,
      "indicators": ["macd", "obv"]
    }
  }
}
```

### 3.4. UI Chart Viewer với 10 chỉ báo

```tsx
// src/sections/chart-viewer/ChartViewer.tsx

<ChartViewer>
  <ChartHeader>
    <SymbolSelector value="FPT" onChange={...} />
    <TimeframeSelector value="1d" options={["1d", "1w", "1m"]} />
    <IndicatorTogglePanel>
      {indicators.map(ind => (
        <ToggleButton
          key={ind.id}
          active={ind.enabled}
          onToggle={() => toggleIndicator(ind.id)}
        >
          {ind.name}
        </ToggleButton>
      ))}
    </IndicatorTogglePanel>
  </ChartHeader>
  
  <ChartContainer>
    <MainChartPanel height="50%">
      {/* Nến OHLCV + MA + EMA + Bollinger + Ichimoku */}
      <CandlestickChart data={ohlcv} />
      {indicators.ma.enabled && <MAOverlay periods={indicators.ma.periods} />}
      {indicators.ichimoku_standard.enabled && <IchimokuOverlay config={indicators.ichimoku_standard} />}
      {indicators.ichimoku_longterm.enabled && timeframe !== "1d" && (
        <IchimokuOverlay config={indicators.ichimoku_longterm} />
      )}
    </MainChartPanel>
    
    <VolumePanel height="15%">
      <VolumeChart data={volume} />
      <VolumeMA period={20} />
    </VolumePanel>
    
    <IndicatorPanel height="15%">
      {/* RSI hoặc Stochastic */}
      <RSIChart data={rsi14} overbought={70} oversold={30} />
    </IndicatorPanel>
    
    <IndicatorPanel height="20%">
      {/* MACD + OBV */}
      <MACDChart data={macd} />
    </IndicatorPanel>
  </ChartContainer>
  
  <ChartFooter>
    <SignalSummary>
      {/* Tổng hợp tín hiệu từ 10 chỉ báo */}
      <SignalBadge indicator="MA" signal="bullish" />
      <SignalBadge indicator="RSI" signal="neutral" value={62.5} />
      <SignalBadge indicator="MACD" signal="bullish" />
      <SignalBadge indicator="Ichimoku" signal="bullish" />
      <OverallSignal strength={0.75} direction="bullish" />
    </SignalSummary>
    <Button onClick={() => addToReport(chartConfig)}>
      ➕ Thêm vào báo cáo
    </Button>
  </ChartFooter>
</ChartViewer>
```

### 3.5. Tín hiệu tổng hợp (Signal Aggregation)

```javascript
function aggregateSignals(indicators) {
  const signals = {
    ma: indicators.ma.current > indicators.ma.ma20 ? 'bullish' : 'bearish',
    rsi: indicators.rsi.value > 70 ? 'overbought' : indicators.rsi.value < 30 ? 'oversold' : 'neutral',
    macd: indicators.macd.histogram > 0 ? 'bullish' : 'bearish',
    bollinger: indicators.price > indicators.bollinger.upper ? 'overbought' : indicators.price < indicators.bollinger.lower ? 'oversold' : 'neutral',
    ichimoku: indicators.price > indicators.ichimoku.senkou_a ? 'bullish' : 'bearish',
    volume: indicators.volume.current > indicators.volume.ma20 ? 'confirming' : 'weak',
    stochastic: indicators.stochastic.k > 80 ? 'overbought' : indicators.stochastic.k < 20 ? 'oversold' : 'neutral'
  };
  
  // Tính tổng hợp
  const bullishCount = Object.values(signals).filter(s => s === 'bullish' || s === 'confirming').length;
  const bearishCount = Object.values(signals).filter(s => s === 'bearish' || s === 'weak').length;
  const total = Object.keys(signals).length;
  
  const strength = Math.max(bullishCount, bearishCount) / total;
  const direction = bullishCount > bearishCount ? 'bullish' : bearishCount > bullishCount ? 'bearish' : 'neutral';
  
  return { signals, strength, direction, bullishCount, bearishCount };
}
```

---

## Phần 4: Tích hợp 3 yêu cầu vào luồng báo cáo

### Luồng hoàn chỉnh với 3 tính năng mới

```
┌─────────────────────────────────────────────────────────────────────────┐
│  YÊU CẦU: "Tạo báo cáo tuần từ YouTube + Stock + News,                  │
│           có audio, chart Ichimoku, chính xác, nguồn rõ ràng"           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  1. REPORT BUILDER                                                      │
│  • Chọn template: "Weekly Deep Analysis"                                │
│  • Sections: Macro + Sector + Stock + Technical Chart + Sentiment +     │
│             Insight + Watchlist + Audio                                   │
│  • Output: Telegram (Macro+Audio), Email (Full+Charts), Dashboard (All)  │
│  • Sources: ☑ YouTube ☑ Stock ☑ RSS                                     │
│  • Time: 7 days                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  2. PRECHECK ENGINE                                                     │
│  • API Health: ✓ Gemini ✓ Groq ✓ VNStock ✓ Telegram ✓ Email            │
│  • Quota: 1.2M / 2M tokens → PASS                                       │
│  • Hardware: RAM 8.2/16GB → 3 workers                                   │
│  • Dependencies: ✓ SQLite ✓ Qdrant                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  3. AGENT SWARM (Parallel)                                              │
│  • YouTube: 29 kênh, 7 ngày, subtitle-first, validate length            │
│  • Stock: VNINDEX + 20 mã, OHLCV 7 ngày, tính 10 chỉ báo                │
│  • News: CafeF + VietStock + SSI, 50 bài, sentiment                    │
│  • Validation: 83/85 sources OK, 2 failed (excluded)                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  4. GROUNDING                                                           │
│  • SQLite: raw_data_json (local primary)                                │
│  • Qdrant: vector embedding (semantic search)                           │
│  • Google Drive → NotebookLM: index + citation                          │
│  • NotebookLM: Tạo Audio Overview (podcast 5 phút)                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  5. ADAPTIVE SYNTHESIS                                                  │
│  • Meta-Prompt 5 bước → Market Regime: Uptrend FOMO                   │
│  • Cross-reference: Bullish (DNSE, SSI) vs Bearish (Fiin)               │
│  • Blind Spot: Không ai nhắc tỷ giá USD/VND                            │
│  • Mọi luận điểm có citation: [Kênh - Video - Ngày]                     │
│  • Số liệu từ API thực, không từ "kiến thức" AI                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  6. RENDER OUTPUT                                                       │
│  • Text: Markdown 4 phần với citation inline                            │
│  • HTML: Bảng biểu, màu sắc, responsive                                 │
│  • Charts: TradingView Lightweight với Ichimoku 9-17-26-26-26         │
│            + Ichimoku 65-129-5-2-2 (khung tuần)                         │
│  • Audio: NotebookLM Audio Overview (5 phút) + TTS fallback            │
│  • Excel: Watchlist data + raw OHLCV                                    │
│  • 3D Graph: D3.js force-directed (nếu chọn)                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  7. DELIVERY                                                            │
│  • Telegram: Text tóm tắt + MP3 Audio Overview                          │
│  • Email: HTML full + Charts PNG + Excel + MP3                          │
│  • Dashboard: Interactive (charts tương tác, filter, raw data view)   │
│  • Notion: Page mới với properties (Regime, Focus Sectors, Citations)   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

*File này bổ sung chi tiết cho 3 yêu cầu nâng cao. Xem thêm:
- Tổng quan: `00_OVERVIEW.md`
- System Graph: `01_SYSTEM_GRAPH.md`
- Lộ trình: `02_UPGRADE_ROADMAP.md`*
