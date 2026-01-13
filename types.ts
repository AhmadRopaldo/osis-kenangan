
export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video'
}

export interface User {
  id: string;
  name: string;
  email: string;
  profilePic?: string;
}

export interface FileData {
  id: string;
  userId: string;
  fileName: string;
  filePath: string;
  fileType: FileType;
  fileSize: number; // in bytes
  uploadDate: string;
  thumbnailUrl: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export type AuthView = 'LOGIN' | 'REGISTER';
