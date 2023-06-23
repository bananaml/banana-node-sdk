import * as http from 'http';
import * as https from 'https';

export class ClientException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientException';
  }
}

export class Client {
  private api_key: string;
  private model_key: string;
  private url: string;
  private verbose: boolean;

  constructor(api_key: string, model_key: string, url: string, verbose: boolean = true) {
    this.api_key = api_key;
    this.model_key = model_key;
    this.url = url;
    this.verbose = verbose;
  }

  public call = async (route: string, json: object = {}, headers: object = {}, retry = true, retry_timeout = 300) => {
    const endpoint = `${this.url.replace(/\/$/, '')}/${route.replace(/^\//, '')}`;

    let backoff_interval = 0.1;
    const start = Date.now();
    let first_call = true;

    while (true) {
      if (Date.now() - start > retry_timeout) {
        throw new ClientException('Retry timeout exceeded');
      }

      if (first_call) {
        first_call = false;
      } else {
        if (this.verbose) {
          console.log('Retrying...');
        }
      }

      backoff_interval *= 2;

      const res = await this.makeRequest(endpoint, json, headers);

      if (this.verbose && res.statusCode !== 200) {
        console.log('Status code:', res.statusCode);
        console.log(res.body);
      }

      if (res.statusCode === 200) {
        const meta = { headers: res.headers };
        try {
          return JSON.parse(res.body), meta;
        } catch {
          throw new ClientException(res.body);
        }
      } else if (res.statusCode === 400) { // user at their quota, retry
        if (!retry) {
          throw new ClientException(res.body);
        }
        await this.sleep(backoff_interval);
        continue;
      } else if (res.statusCode === 401 || res.statusCode === 404 || res.statusCode === 413) {
        throw new ClientException(res.body);
      } else if (res.statusCode === 418) {
        throw new ClientException('banana is a teapot');
      } else if (res.statusCode === 423) { // potassium threw an error, lock and retry
        if (!retry) {
          let message = res.body;
          message += '423 errors are returned by Potassium when your server(s) are all busy handling GPU endpoints.\nIn most cases, you just want to retry later. Running banana.call() with the retry=true argument handles this for you.';
          throw new ClientException(message);
        }
        await this.sleep(backoff_interval);
        continue;
      } else if (res.statusCode === 500) {
        throw new ClientException(res.body);
      } else if (res.statusCode === 503) { // banana had a temporary error, retry
        if (!retry) {
          throw new ClientException(res.body);
        }
        await this.sleep(backoff_interval);
        continue;
      } else {
        throw new ClientException(`Unexpected HTTP response code: ${res.statusCode}`);
      }
    }
  };

  private makeRequest = (url: string, json: object, headers: object) => {
    return new Promise<{ statusCode: number, headers: http.IncomingHttpHeaders, body: string }>((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const data = JSON.stringify(json);

      const req = protocol.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-BANANA-API-KEY': this.api_key,
          'X-BANANA-MODEL-KEY': this.model_key,
          ...headers,
        },
      }, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          resolve({ statusCode: res.statusCode || 0, headers: res.headers, body });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(data);
      req.end();
    });
  };

  private sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
}
