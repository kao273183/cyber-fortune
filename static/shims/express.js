// Minimal in-browser stand-in for express.Router(), covering only what
// server/routes/fortune.js uses: route registration, path params,
// req.query/body/params, and res.status/json/send/set/setHeader.

function compilePath(pattern) {
  const keys = [];
  const source = pattern
    .split('/')
    .map((seg) => {
      if (seg.startsWith(':')) {
        keys.push(seg.slice(1));
        return '([^/]+)';
      }
      return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  return { keys, regex: new RegExp(`^${source}/?$`) };
}

function parseQuery(searchParams) {
  const query = {};
  for (const [key, value] of searchParams) {
    if (Object.prototype.hasOwnProperty.call(query, key)) {
      query[key] = [].concat(query[key], value);
    } else {
      query[key] = value;
    }
  }
  return query;
}

function createResponse(resolve) {
  const headers = {};
  let statusCode = 200;
  let finished = false;
  const finish = (body, isJson) => {
    if (finished) return;
    finished = true;
    resolve({ status: statusCode, headers, body, isJson });
  };
  const res = {
    get headersSent() {
      return finished;
    },
    status(code) {
      statusCode = code;
      return res;
    },
    set(name, value) {
      headers[String(name).toLowerCase()] = String(value);
      return res;
    },
    setHeader(name, value) {
      res.set(name, value);
    },
    json(payload) {
      if (!headers['content-type']) headers['content-type'] = 'application/json; charset=utf-8';
      finish(JSON.stringify(payload ?? null), true);
      return res;
    },
    send(payload) {
      if (payload !== null && typeof payload === 'object') return res.json(payload);
      finish(payload === undefined ? '' : String(payload), false);
      return res;
    },
  };
  return res;
}

function Router() {
  const routes = [];
  const router = {};

  for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
    router[method] = (pattern, ...handlers) => {
      routes.push({ method: method.toUpperCase(), ...compilePath(pattern), handlers });
      return router;
    };
  }

  /**
   * Dispatch one request through the matching route.
   * Resolves to { status, headers, body (string), isJson }.
   */
  router.handle = ({ method, path, searchParams, body }) =>
    new Promise((resolve) => {
      const upper = String(method || 'GET').toUpperCase();
      let match = null;
      let route = null;
      for (const r of routes) {
        if (r.method !== upper) continue;
        match = r.regex.exec(path);
        if (match) {
          route = r;
          break;
        }
      }

      const res = createResponse(resolve);
      const fail = (err) => {
        console.error('[cyber-fortune] local API error:', err);
        if (!res.headersSent) {
          res.status(err?.status || 500).json({ ok: false, error: err?.message || 'Internal Server Error' });
        }
      };

      if (!route) {
        res.status(404).json({ ok: false, error: `Cannot ${upper} ${path}` });
        return;
      }

      const params = {};
      route.keys.forEach((key, i) => {
        params[key] = decodeURIComponent(match[i + 1]);
      });
      const req = {
        method: upper,
        path,
        params,
        query: parseQuery(searchParams),
        // Round-trip through JSON so handlers see what a real network request would carry.
        body: body === undefined ? {} : JSON.parse(JSON.stringify(body)),
        headers: {},
      };

      let index = 0;
      const next = (err) => {
        if (err) return fail(err);
        const handler = route.handlers[index++];
        if (!handler) {
          res.status(404).json({ ok: false, error: `Cannot ${upper} ${path}` });
          return undefined;
        }
        try {
          const out = handler(req, res, next);
          if (out && typeof out.then === 'function') out.catch(fail);
        } catch (e) {
          fail(e);
        }
        return undefined;
      };
      next();
    });

  return router;
}

module.exports = { Router };
module.exports.Router = Router;
