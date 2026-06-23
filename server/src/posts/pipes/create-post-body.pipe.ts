import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  ValidationPipe,
} from '@nestjs/common';
import { CreatePostDto } from 'src/posts/dto';

type MultipartBody = Record<string, unknown>;

const metadata: ArgumentMetadata = {
  metatype: CreatePostDto,
  type: 'body',
};

const firstValue = (value: unknown): unknown =>
  Array.isArray(value) ? value[0] : value;

const values = (value: unknown): unknown[] => {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
};

const isObjectWithFields = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  Object.keys(value as Record<string, unknown>).length > 0;

const readMultipartPoll = (body: MultipartBody): unknown => {
  if (isObjectWithFields(body.poll)) return body.poll;

  const votingLength = firstValue(body['poll[votingLength]']);
  const options = values(body['poll[options][]']);

  if (votingLength === undefined && options.length === 0) return undefined;

  return {
    votingLength,
    options,
  };
};

const readMultipartLocation = (body: MultipartBody): unknown => {
  if (isObjectWithFields(body.location)) return body.location;

  const name = firstValue(body['location[name]']);
  const formattedAddress = firstValue(body['location[formattedAddress]']);
  const latitude = firstValue(body['location[latitude]']);
  const longitude = firstValue(body['location[longitude]']);

  if (
    name === undefined &&
    formattedAddress === undefined &&
    latitude === undefined &&
    longitude === undefined
  ) {
    return undefined;
  }

  return {
    formattedAddress,
    latitude,
    longitude,
    name,
  };
};

export const normalizeCreatePostBody = (
  value: unknown,
): Record<string, unknown> => {
  const body =
    typeof value === 'object' && value !== null
      ? (value as MultipartBody)
      : {};

  return {
    content: body.content,
    latitude: body.latitude,
    location: readMultipartLocation(body),
    longitude: body.longitude,
    poll: readMultipartPoll(body),
    title: body.title,
  };
};

@Injectable()
export class CreatePostBodyPipe implements PipeTransform {
  private readonly validationPipe = new ValidationPipe({
    forbidUnknownValues: false,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    whitelist: true,
  });

  async transform(value: unknown): Promise<CreatePostDto> {
    return (await this.validationPipe.transform(
      normalizeCreatePostBody(value),
      metadata,
    )) as CreatePostDto;
  }
}
