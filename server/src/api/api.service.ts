import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const DEFAULT_API_TIMEOUT_MS = 10000;

@Injectable()
export class ApiService {
  constructor(
    @Inject('API_URL') private readonly apiUrl: string,
    private readonly configService: ConfigService,
  ) {}

  async get<T>(
    path: string,
    params?: Record<string, unknown>,
    headers?: Record<string, string>,
  ): Promise<T> {
    const response = await axios.get<T>(this.getUrl(path), {
      headers,
      params,
      timeout: this.getTimeoutMs(),
    });

    return response.data;
  }

  async post<T>(path: string, data?: Record<string, unknown>): Promise<T> {
    const response = await axios.post<T>(this.getUrl(path), data, {
      timeout: this.getTimeoutMs(),
    });

    return response.data;
  }

  private getUrl(path: string): string {
    return `${this.apiUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  }

  private getTimeoutMs(): number {
    const configuredTimeout = Number(
      this.configService.get<string>('API_TIMEOUT_MS'),
    );

    return Number.isInteger(configuredTimeout) && configuredTimeout > 0
      ? configuredTimeout
      : DEFAULT_API_TIMEOUT_MS;
  }
}
