import type { NextApiRequest, NextApiResponse } from 'next/types';

interface ServiceVersion {
  name: string;
  version: string;
  status: 'ok' | 'unreachable';
}

function parseCheckUrls(): Array<{ label: string; url: string }> {
  const raw = process.env.VERSION_CHECK_URLS || '';
  if (!raw) return [];
  return raw.split(',').map((entry) => {
    const [label, hostPort] = entry.split('=');
    return { label: label.trim(), url: `http://${hostPort.trim()}/info` };
  });
}

async function fetchServiceInfo(
  label: string,
  url: string,
  timeoutMs: number,
): Promise<ServiceVersion> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const data = await res.json();
    return { name: label, version: data.version ?? 'unknown', status: 'ok' };
  } catch {
    return { name: label, version: 'unknown', status: 'unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const targets = parseCheckUrls();
  const results = await Promise.all(
    targets.map((t) => fetchServiceInfo(t.label, t.url, 2000)),
  );

  const uiVersion = process.env.SERVICE_VERSION || 'dev';
  results.push({ name: 'ui', version: uiVersion, status: 'ok' });

  const env = process.env.SERVICE_ENV || 'dev';
  res.status(200).json({ env, services: results });
}
