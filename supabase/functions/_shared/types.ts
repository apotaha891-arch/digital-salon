export interface ChatMessage {
  role: 'user' | 'bot' | 'assistant'
  text?: string
  content?: string
}

export interface GeminiPart {
  text?: string
  thought?: boolean   // Gemini 2.5 thinking mode — must be filtered out before showing to users
  functionCall?: {
    name: string
    args: Record<string, unknown>
  }
  functionResponse?: {
    name: string
    response: { content: unknown }
  }
}

export interface GeminiContent {
  role: string
  parts: GeminiPart[]
}

export interface GeminiCandidate {
  content: GeminiContent
  finishReason?: string
}

export interface GeminiResponse {
  candidates?: GeminiCandidate[]
  error?: {
    message: string
    code: number
    status: string
  }
}
