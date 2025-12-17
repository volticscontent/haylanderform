export interface AgentResponse {
  message: string;
  nextAction?: 'wait_user' | 'close_ticket' | 'escalate_human';
}

export interface AgentContext {
  userId: string;
  userName?: string;
  userPhone: string;
  history: { role: 'user' | 'system' | 'assistant', content: string }[];
}

export type AgentType = 'apolo' | 'vendedor' | 'atendente';
