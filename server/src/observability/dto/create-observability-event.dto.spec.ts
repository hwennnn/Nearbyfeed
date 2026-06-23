import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateObservabilityEventDto } from './create-observability-event.dto';

const validateDto = async (body: Record<string, unknown>) =>
  await validate(plainToInstance(CreateObservabilityEventDto, body));

describe('CreateObservabilityEventDto', () => {
  it('accepts normal web telemetry events', async () => {
    await expect(
      validateDto({
        name: 'web.map_viewed',
        route: '/map',
        sessionId: 'session-123',
        userId: 42,
        clientTimestamp: '2026-06-23T07:58:00.123Z',
        properties: {
          distance: 200,
          source: 'map',
          timeWindow: '24h',
        },
      }),
    ).resolves.toHaveLength(0);
  });

  it('rejects event names with whitespace or control characters', async () => {
    const errors = await validateDto({
      name: 'api.request\nx-forged-log-line',
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('matches');
  });

  it('rejects control characters in telemetry routes', async () => {
    const errors = await validateDto({
      name: 'web.details_viewed',
      route: '/details?postId=42\nx-forged-line',
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('route');
    expect(errors[0].constraints).toHaveProperty('matches');
  });

  it('rejects control characters in telemetry session ids', async () => {
    const errors = await validateDto({
      name: 'web.map_viewed',
      sessionId: 'session-123\tforged',
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('sessionId');
    expect(errors[0].constraints).toHaveProperty('matches');
  });

  it('rejects malformed client timestamps', async () => {
    const errors = await validateDto({
      name: 'web.feed_viewed',
      clientTimestamp: 'yesterday-ish',
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isIso8601');
  });

  it('rejects non-positive or unsafe telemetry user ids', async () => {
    await expect(
      validateDto({
        name: 'web.feed_viewed',
        userId: 0,
      }),
    ).resolves.toHaveLength(1);

    await expect(
      validateDto({
        name: 'web.feed_viewed',
        userId: -1,
      }),
    ).resolves.toHaveLength(1);

    await expect(
      validateDto({
        name: 'web.feed_viewed',
        userId: Number.MAX_SAFE_INTEGER + 1,
      }),
    ).resolves.toHaveLength(1);
  });

  it('rejects telemetry payloads with too many properties', async () => {
    const errors = await validateDto({
      name: 'web.feed_viewed',
      properties: Object.fromEntries(
        Array.from({ length: 25 }, (_, index) => [`key_${index}`, index]),
      ),
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty(
      'observabilityPropertiesBudget',
    );
  });

  it('rejects telemetry properties with oversized keys or values', async () => {
    const errors = await validateDto({
      name: 'web.feed_viewed',
      properties: {
        ['x'.repeat(81)]: 'ok',
        normal: 'x'.repeat(501),
      },
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty(
      'observabilityPropertiesBudget',
    );
  });
});
