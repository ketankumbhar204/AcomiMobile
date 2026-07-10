/**
 * Benchmark dashboard-related APIs (3 runs each).
 * Usage: node scripts/benchmark-dashboard-apis.mjs [mobile] [spaceId]
 */
const BASE = 'http://localhost:8080/api/v1';
const MOBILE = process.argv[2] ?? '9123456789';
const SPACE_ID = process.argv[3] ?? '2cec6d94-0253-478c-a9f1-345672c676fd';
const MONTH = '2026-07';
const MENU_DATE = '2026-07-05';
const RUNS = 3;

async function request(method, path, token, body) {
  const start = performance.now();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const elapsed = performance.now() - start;
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, elapsed, json };
}

async function login() {
  await request('POST', '/auth/send-otp', null, { mobileNumber: MOBILE });
  const verify = await request('POST', '/auth/verify-otp', null, {
    mobileNumber: MOBILE,
    otp: '111111',
  });
  if (verify.status !== 200) {
    throw new Error(`Login failed: ${verify.status} ${JSON.stringify(verify.json)}`);
  }
  return verify.json?.data?.accessToken ?? verify.json?.data?.token;
}

function stats(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const avg = times.reduce((s, t) => s + t, 0) / times.length;
  return {
    min: sorted[0].toFixed(0),
    avg: avg.toFixed(0),
    max: sorted[sorted.length - 1].toFixed(0),
    runs: times.map(t => t.toFixed(0)).join(', '),
  };
}

async function benchmark(name, fn) {
  const times = [];
  let lastPayload = null;
  for (let i = 0; i < RUNS; i += 1) {
    const result = await fn();
    times.push(result.elapsed);
    lastPayload = result;
  }
  return { name, ...stats(times), status: lastPayload?.status, sample: lastPayload?.sample };
}

async function main() {
  console.log(`Benchmarking dashboard APIs for space ${SPACE_ID}`);
  console.log(`Mobile: ${MOBILE}\n`);

  const token = await login();
  if (!token) {
    throw new Error('No access token returned');
  }
  console.log('Authenticated.\n');

  const buildingsRes = await request('GET', `/spaces/${SPACE_ID}/buildings`, token);
  const buildings = buildingsRes.json?.data ?? [];

  const endpoints = [
    {
      name: 'dashboard-summary',
      run: () =>
        request('GET', `/spaces/${SPACE_ID}/dashboard-summary?month=${MONTH}`, token).then(r => ({
          elapsed: r.elapsed,
          status: r.status,
          sample: summarizeDashboard(r.json?.data),
        })),
    },
    {
      name: 'buildings list',
      run: () =>
        request('GET', `/spaces/${SPACE_ID}/buildings`, token).then(r => ({
          elapsed: r.elapsed,
          status: r.status,
          sample: { count: r.json?.data?.length ?? 0 },
        })),
    },
    ...buildings.slice(0, 3).map((b, i) => ({
      name: `building-summary[${i + 1}] ${b.name ?? b.buildingId?.slice(0, 8)}`,
      run: () =>
        request('GET', `/spaces/${SPACE_ID}/buildings/${b.buildingId}/summary`, token).then(r => ({
          elapsed: r.elapsed,
          status: r.status,
          sample: {
            beds: r.json?.data?.beds,
            occupiedBeds: r.json?.data?.occupiedBeds,
            availableBeds: r.json?.data?.availableBeds,
          },
        })),
    })),
    {
      name: 'beds AVAILABLE (page 0)',
      run: () =>
        request(
          'GET',
          `/spaces/${SPACE_ID}/beds?status=AVAILABLE&page=0&size=1`,
          token,
        ).then(r => ({
          elapsed: r.elapsed,
          status: r.status,
          sample: { totalElements: r.json?.data?.totalElements },
        })),
    },
    {
      name: 'meal headcount day',
      run: () =>
        request('GET', `/spaces/${SPACE_ID}/meal-headcount/${MENU_DATE}`, token).then(r => ({
          elapsed: r.elapsed,
          status: r.status,
          sample: { slots: r.json?.data?.slots?.length ?? 0 },
        })),
    },
    {
      name: 'daily menus by date',
      run: () =>
        request('GET', `/spaces/${SPACE_ID}/daily-menus?date=${MENU_DATE}`, token).then(r => ({
          elapsed: r.elapsed,
          status: r.status,
          sample: { count: r.json?.data?.length ?? 0 },
        })),
    },
    {
      name: 'meal polls + eligibility (parallel)',
      run: async () => {
        const start = performance.now();
        const [polls, eligibility] = await Promise.all([
          request('GET', `/spaces/${SPACE_ID}/meal-polls/${MENU_DATE}`, token),
          request('GET', `/spaces/${SPACE_ID}/meal-eligibility/${MENU_DATE}`, token),
        ]);
        return {
          elapsed: performance.now() - start,
          status: polls.status,
          sample: {
            polls: polls.json?.data?.polls?.length ?? 0,
            eligible: eligibility.json?.data?.distinctEligibleMemberCount,
          },
        };
      },
    },
    {
      name: 'subscription pending requests',
      run: () =>
        request('GET', `/spaces/${SPACE_ID}/subscription-plans/activation-requests?status=PENDING`, token).then(
          r => ({
            elapsed: r.elapsed,
            status: r.status,
            sample: { pending: r.json?.data?.length ?? 0 },
          }),
        ),
    },
    {
      name: 'active occupancies (page 0)',
      run: () =>
        request('GET', `/spaces/${SPACE_ID}/occupancies?status=ACTIVE&page=0&size=1`, token).then(r => ({
          elapsed: r.elapsed,
          status: r.status,
          sample: { totalElements: r.json?.data?.totalElements },
        })),
    },
  ];

  const results = [];
  for (const ep of endpoints) {
    results.push(await benchmark(ep.name, ep.run));
  }

  console.log('Results (ms):');
  console.table(
    results.map(r => ({
      API: r.name,
      Status: r.status,
      'Min ms': r.min,
      'Avg ms': r.avg,
      'Max ms': r.max,
      Runs: r.runs,
      Sample: JSON.stringify(r.sample),
    })),
  );
}

function summarizeDashboard(data) {
  if (!data) return null;
  return {
    occupiedBeds: data.accommodationOperations?.occupiedBeds,
    vacantBeds: data.accommodationOperations?.vacantBeds,
    moveIns: data.accommodationOperations?.moveInsThisMonth,
    pendingPayments: data.accommodationOperations?.pendingPaymentsCount,
    attentionCount: data.attention?.length ?? 0,
    attentionKinds: (data.attention ?? []).map(a => a.kind),
    financialPending: data.financial?.pending,
  };
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
