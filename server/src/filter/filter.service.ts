import { Injectable } from '@nestjs/common';
import Filter from 'bad-words';

@Injectable()
export class FilterService {
  private readonly filter = new Filter();

  filterText(text: string): string {
    return this.filter.clean(text);
  }
}
