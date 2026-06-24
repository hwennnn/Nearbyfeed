import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const serverRoot = join(__dirname, '..', '..');
const readServerFile = (path: string): string =>
  readFileSync(join(serverRoot, path), 'utf8');

describe('Grafana observability provisioning', () => {
  it('mounts ClickHouse datasource and dashboard provisioning into Grafana', () => {
    const compose = readServerFile('docker-compose.yml');

    expect(compose).toContain(
      './observability/grafana/provisioning/datasources:/etc/grafana/provisioning/datasources:ro',
    );
    expect(compose).toContain(
      './observability/grafana/provisioning/dashboards:/etc/grafana/provisioning/dashboards:ro',
    );
    expect(compose).toContain(
      './observability/grafana/dashboards:/var/lib/grafana/dashboards/nearbyfeed:ro',
    );
  });

  it('keeps the self-hosted ClickHouse database configurable across the stack', () => {
    const compose = readServerFile('docker-compose.yml');
    const initScript = readServerFile('observability/clickhouse/init/001_events.sh');

    expect(compose).toContain(
      'CLICKHOUSE_DB: ${CLICKHOUSE_DATABASE:-nearbyfeed_observability}',
    );
    expect(compose).toContain(
      'CLICKHOUSE_DATABASE: ${CLICKHOUSE_DATABASE:-nearbyfeed_observability}',
    );
    expect(initScript).toContain(
      'DATABASE="${CLICKHOUSE_DB:-nearbyfeed_observability}"',
    );
    expect(initScript).not.toContain('nearbyfeed_observability.nearbyfeed_events');
  });

  it('provisions a reusable ClickHouse datasource for the self-hosted stack', () => {
    const datasource = readServerFile(
      'observability/grafana/provisioning/datasources/clickhouse.yml',
    );

    expect(datasource).toContain('uid: nearbyfeed-clickhouse');
    expect(datasource).toContain('type: grafana-clickhouse-datasource');
    expect(datasource).toContain('host: clickhouse');
    expect(datasource).toContain('port: 8123');
    expect(datasource).toContain('protocol: http');
    expect(datasource).toContain('defaultDatabase: ${CLICKHOUSE_DATABASE}');
    expect(datasource).not.toContain('sk-mino-');
  });

  it('ships a parseable product observability dashboard backed by that datasource', () => {
    const dashboardPath = join(
      serverRoot,
      'observability/grafana/dashboards/nearbyfeed-observability.json',
    );
    expect(existsSync(dashboardPath)).toBe(true);

    const dashboard = JSON.parse(readFileSync(dashboardPath, 'utf8')) as {
      panels?: Array<{ targets?: Array<{ datasource?: { uid?: string } }> }>;
      tags?: string[];
      title?: string;
      uid?: string;
    };

    expect(dashboard.uid).toBe('nearbyfeed-observability');
    expect(dashboard.title).toBe('NearbyFeed Observability');
    expect(dashboard.tags).toEqual(expect.arrayContaining(['nearbyfeed']));
    expect(dashboard.panels?.length).toBeGreaterThanOrEqual(3);
    expect(
      dashboard.panels?.every((panel) =>
        panel.targets?.every(
          (target) => target.datasource?.uid === 'nearbyfeed-clickhouse',
        ),
      ),
    ).toBe(true);

    const rawSql = JSON.stringify(dashboard);
    expect(rawSql).toContain('FROM nearbyfeed_events');
    expect(rawSql).not.toContain('nearbyfeed_observability.nearbyfeed_events');
  });
});
