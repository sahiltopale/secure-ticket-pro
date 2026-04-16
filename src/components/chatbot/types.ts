export type Msg = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export type QuickReply = {
  label: string;
  message: string;
  icon?: string;
};
