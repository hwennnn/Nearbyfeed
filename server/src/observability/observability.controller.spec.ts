import { ObservabilityController } from './observability.controller';

describe('ObservabilityController', () => {
  it('captures public web telemetry events', async () => {
    const observabilityService = {
      captureEvent: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new ObservabilityController(
      observabilityService as any,
    );

    await expect(
      controller.captureEvent({
        name: 'web.map_viewed',
        route: 'map',
        sessionId: 'client-session-1',
        properties: {
          distance: 200,
        },
      }),
    ).resolves.toBeUndefined();

    expect(observabilityService.captureEvent).toHaveBeenCalledWith({
      name: 'web.map_viewed',
      route: 'map',
      sessionId: 'client-session-1',
      properties: {
        distance: 200,
      },
    });
  });

  it('does not trust client-supplied user ids for public telemetry events', async () => {
    const observabilityService = {
      captureEvent: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new ObservabilityController(
      observabilityService as any,
    );

    await controller.captureEvent({
      name: 'web.map_viewed',
      route: 'map',
      sessionId: 'client-session-1',
      userId: 42,
      properties: {
        distance: 200,
      },
    });

    expect(observabilityService.captureEvent).toHaveBeenCalledWith({
      name: 'web.map_viewed',
      route: 'map',
      sessionId: 'client-session-1',
      properties: {
        distance: 200,
      },
    });
  });

  it('rejects public telemetry that tries to forge backend event streams', async () => {
    const observabilityService = {
      captureEvent: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new ObservabilityController(
      observabilityService as any,
    );

    await expect(
      controller.captureEvent({
        name: 'api.request',
        route: '/posts',
        properties: {
          statusCode: 200,
        },
      }),
    ).rejects.toThrow('Only web telemetry events can be captured publicly');

    expect(observabilityService.captureEvent).not.toHaveBeenCalled();
  });
});
