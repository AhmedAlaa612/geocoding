export interface GeocodeQuery {
  address: string;
  language?: string;
}

export interface ReverseQuery {
  lat: string;
  lng: string;
  language?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
