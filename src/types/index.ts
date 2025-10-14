export interface EssayResult {
  finalScore: number;
  competencies: {
    [key: string]: number;
  };
  feedback: {
    summary: string;
    improvements: string[];
    attention: string[];
    congratulations: string[];
    competencyFeedback: {
      [key: string]: string;
    };
  };
  originalEssay: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface LoginFormData {
  email: string;
  password: string;
  name?: string;
}

export type SubmissionType = 'text' | 'image';