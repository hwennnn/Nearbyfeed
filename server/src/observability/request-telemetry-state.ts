const REQUEST_TELEMETRY_CAPTURED_KEY = '__nearbyfeedTelemetryCaptured';

type RequestTelemetryState = {
  [REQUEST_TELEMETRY_CAPTURED_KEY]?: boolean;
};

export const hasRequestTelemetryCaptured = (request: object): boolean =>
  (request as RequestTelemetryState)[REQUEST_TELEMETRY_CAPTURED_KEY] === true;

export const markRequestTelemetryCaptured = (request: object): void => {
  (request as RequestTelemetryState)[REQUEST_TELEMETRY_CAPTURED_KEY] = true;
};
