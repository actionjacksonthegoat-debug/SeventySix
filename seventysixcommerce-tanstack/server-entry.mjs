import http from 'node:http';
import { Readable } from 'node:stream';
import app from './dist/server/server.js';

const port = Number(process.env.PORT ?? '3000');
const host = process.env.HOST ?? '0.0.0.0';

const server = http.createServer(async (req, res) => {
  try {
    const method = req.method ?? 'GET';
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          headers.append(key, item);
        }
      } else {
        headers.set(key, value);
      }
    }

    const url = `http://${req.headers.host ?? `${host}:${port}`}${req.url ?? '/'}`;
    const init = {
      method,
      headers,
      body: method === 'GET' || method === 'HEAD' ? undefined : Readable.toWeb(req),
      duplex: 'half',
    };

    const request = new Request(url, init);
    const response = await app.fetch(request);

    res.statusCode = response.status;

    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }

    if (response.body == null) {
      res.end();
      return;
    }

    Readable.fromWeb(response.body).pipe(res);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: message }));
  }
});

server.listen(port, host, () => {
  process.stdout.write(`Server listening on http://${host}:${port}\n`);
});
