export interface VerificationResult {
  trustScore: number;
  summary: string;
  status: string;
  verificationId?: string;
  sources?: Array<{
    url: string;
    title?: string;
    reliability_score?: number;
  }>;
}

export interface CachedVerification {
  content: string;
  contentHash: string;
  result: VerificationResult;
  timestamp: number;
}

export interface StorageData {
  apiKey?: string;
  verifications?: CachedVerification[];
  settings?: {
    autoVerify: boolean;
    showBadges: boolean;
    trustThreshold: number;
  };
}

export interface MessageRequest {
  type: 'VERIFY_CONTENT' | 'GET_API_KEY' | 'SAVE_API_KEY';
  content?: string;
  apiKey?: string;
}

export interface MessageResponse {
  success: boolean;
  data?: VerificationResult;
  error?: string;
}
