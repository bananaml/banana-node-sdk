import * as http from 'http';
import * as https from 'https';

export class ClientException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientException';
  }
}

export class Client {
  private apiKey: string;
  private modelKey: string;
  private url: string;
  private verbose: boolean;

  constructor(apiKey: string, modelKey: string, url: string, verbose: boolean = true) {
    this.apiKey = apiKey;
    this.modelKey = modelKey;
    this.url = url;
    this.verbose = verbose;
  }

  public call = async (route: string, json: object = {}, headers: object = {}, retry = true, retryTimeout = 300) => {
    const endpoint = `${this.url.replace(/\/$/, '')}/${route.replace(/^\//, '')}`;

    let backoffInterval = 0.1;
    const start = Date.now();
    let firstCall = true;

    while (true) {
      if (Date.now() - start > retryTimeout) {
        throw new ClientException('Retry timeout exceeded');
      }

      if (firstCall) {
        firstCall = false;
      } else {
        if (this.verbose) {
          console.log('Retrying...');
        }
      }

      backoffInterval *= 2;

      const res = await this.makeRequest(endpoint, json, headers);

      if (this.verbose && res.statusCode !== 200) {
        console.log('Status code:', res.statusCode);
        console.log(res.body);
      }

      // success case -> return json and metadata
      if (res.statusCode === 200) {
        // parse res.headers of type http.IncomingHttpHeaders to object
        const meta = { headers: res.headers };
        try {
          const json = JSON.parse(res.body);
          
          return [json, meta];
        } catch {
          throw new ClientException(res.body);
        }
      
      } 
      
      // user at their quota -> retry
      else if (res.statusCode === 400) { // user at their quota, retry
        if (!retry) {
          throw new ClientException(res.body);
        }
        await this.sleep(backoffInterval);
        continue;
      } 
      
      // bad auth || endpoint doesn't exist || payload too large -> throw
      else if (res.statusCode === 401 || res.statusCode === 404 || res.statusCode === 413) {
        throw new ClientException(res.body);
      } 
      
      // banana is a teapot -> throw
      else if (res.statusCode === 418) {
        throw new ClientException('banana is a teapot');
      } 
      
      // potassium threw locked error -> retry
      else if (res.statusCode === 423) {
        if (!retry) {
          let message = res.body;
          message += '423 errors are returned by Potassium when your server(s) are all busy handling GPU endpoints.\nIn most cases, you just want to retry later. Running banana.call() with the retry=true argument handles this for you.';
          throw new ClientException(message);
        }
        await this.sleep(backoffInterval);
        continue;
      } 
      
      // user's server had an unrecoverable error -> throw
      else if (res.statusCode === 500) {
        throw new ClientException(res.body);
      } 
      
      // banana had a temporary error -> retry
      else if (res.statusCode === 503) { // banana had a temporary error, retry
        if (!retry) {
          throw new ClientException(res.body);
        }
        await this.sleep(backoffInterval);
        continue;
      } 
      
      
      else {
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
          'X-BANANA-API-KEY': this.apiKey,
          'X-BANANA-MODEL-KEY': this.modelKey,
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
