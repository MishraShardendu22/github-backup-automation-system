export interface AuthState {
  token: string | null;
  username: string | null;
}

export interface LoginResponse {
  access_token: string;
}
