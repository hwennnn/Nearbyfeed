import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ProviderIdValidationPipe implements PipeTransform {
  readonly allowedProviders = ['email', 'google', 'apple'];

  transform(value: any): string {
    if (!this.isValidProvider(value)) {
      throw new BadRequestException(`"${value}" is an invalid provider`);
    }
    return value.toUpperCase();
  }

  private isValidProvider(provider: string): boolean {
    return this.allowedProviders.includes(provider.toLowerCase());
  }
}
