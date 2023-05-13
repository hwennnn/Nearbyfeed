import { Inject, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ApiService {
  constructor(
    @Inject('API_URL') private readonly apiUrl: string,
    private readonly logger: Logger,
  ) {}

  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    const response = await axios.get<T>(`${this.apiUrl}${path}`, { params });

    return response.data;
  }

  async post<T>(path: string, data?: Record<string, any>): Promise<T> {
    const response = await axios.post<T>(`${this.apiUrl}${path}`, data);

    return response.data;
  }
}
