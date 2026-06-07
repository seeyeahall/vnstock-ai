export const YOUTUBE_CHANNELS = [
  { id: "UC1lT1xD9z8", name: "F0 Trader VN" },
  { id: "UC2mT7D9z9A", name: "Chung Khoan Thuc Chien" },
  { id: "UC3nT8D9z9B", name: "Dau Tu Chung Khoan" },
  { id: "UC4oT9D9z9C", name: "Trader Viet Nam" },
  { id: "UC5pT9D9z9D", name: "Chung Khoan Phai Sinh" },
  { id: "UC6qT9D9z9E", name: "Nha Dau Tu Thong Thai" },
  { id: "UC7rT9D9z9F", name: "Kinh Te Viet Nam" },
  { id: "UC8sT9D9z9G", name: "Tai Chinh Ca Nhan" },
  { id: "UC9tT9D9z9H", name: "Dau Tu Bat Dong San" },
  { id: "UC0uT9D9z9I", name: "Crypto Viet Nam" },
  { id: "UC1vT9D9z9J", name: "Forex Trader VN" },
  { id: "UC2wT9D9z9K", name: "Phan Tich Co Phieu" },
  { id: "UC3xT9D9z9L", name: "Chung Khoan FPT" },
  { id: "UC4yT9D9z9M", name: "Vietstock News" },
  { id: "UC5zT9D9z9N", name: "CafeF Channel" },
  { id: "UC6aT9D9z9O", name: "DNSE Trading" },
  { id: "UC7bT9D9z9P", name: "SSI Research" },
  { id: "UC8cT9D9z9Q", name: "VNDirect Insights" },
  { id: "UC9dT9D9z9R", name: "MB Securities" },
  { id: "UC0eT9D9z9S", name: "BSC Analysis" },
  { id: "UC1fT9D9z9T", name: "KBSV Research" },
  { id: "UC2gT9D9z9U", name: "VCBS Channel" },
  { id: "UC3hT9D9z9V", name: "HSC Research" },
  { id: "UC4iT9D9z9W", name: "Saigon Securities" },
  { id: "UC5jT9D9z9X", name: "Rong Viet Research" },
  { id: "UC6kT9D9z9Y", name: "Mirae Asset VN" },
  { id: "UC7lT9D9z9Z", name: "Yuanta Vietnam" },
  { id: "UC8mT9D9z0a", name: "KIS Vietnam" },
  { id: "UC9nT9D9z0b", name: "VPBank Securities" },
];

export const API_KEYS: Record<string, string[]> = {
  gemini: ["GEMINI_API_KEY_1", "GEMINI_API_KEY_2"],
  groq: ["GROQ_API_KEY_1", "GROQ_API_KEY_2"],
  openrouter: ["OPENROUTER_API_KEY_1", "OPENROUTER_API_KEY_2"],
  deepseek: ["DEEPSEEK_API_KEY_1", "DEEPSEEK_API_KEY_2"],
  openai: ["OPENAI_API_KEY_1", "OPENAI_API_KEY_2"],
  kimi: ["KIMI_API_KEY_1", "KIMI_API_KEY_2"],
  together: ["TOGETHER_API_KEY_1", "TOGETHER_API_KEY_2"],
  minimax: ["MINIMAX_API_KEY_1", "MINIMAX_API_KEY_2"],
  cloudflare: ["CLOUDFLARE_API_KEY_1", "CLOUDFLARE_API_KEY_2"],
  byteplus: ["BYTEPLUS_API_KEY_1", "BYTEPLUS_API_KEY_2"],
  nvidia: ["NVIDIA_API_KEY_1", "NVIDIA_API_KEY_2"],
  ollama: ["OLLAMA_API_KEY_1", "OLLAMA_API_KEY_2"],
};

export function getFirstKey(provider: string): string | undefined {
  const keys = API_KEYS[provider];
  return keys ? keys[0] : undefined;
}
