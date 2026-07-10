export interface StatusState {
  text: string;
  isError: boolean;
}

export interface LoginRouteState {
  message?: string;
}

export interface AuthenticatedRouteState {
  email?: string;
  message?: string;
}