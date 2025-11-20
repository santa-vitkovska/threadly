export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
}

