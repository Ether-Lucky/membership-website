// shims/opentelemetry-shim.js
// Supabase JS references @opentelemetry/api internally but never actually
// uses it in browser/React Native environments. This empty shim satisfies
// the import so the bundler doesn't crash.
module.exports = {
    trace: {
      getTracer: () => ({
        startSpan: () => ({
          end: () => {},
          setAttribute: () => {},
          setStatus: () => {},
        }),
      }),
      getActiveSpan: () => null,
      setSpan: () => {},
    },
    context: {
      with: (_ctx, fn) => fn(),
      active: () => ({}),
    },
    propagation: {
      inject: () => {},
      extract: () => ({}),
    },
    diag: {
      setLogger: () => {},
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {},
    },
    DiagConsoleLogger: class {},
    DiagLogLevel: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, NONE: 4 },
    SpanStatusCode: { UNSET: 0, OK: 1, ERROR: 2 },
  };