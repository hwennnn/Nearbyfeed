import { ObservabilityController } from './observability.controller';

describe('ObservabilityController', () => {
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
});
