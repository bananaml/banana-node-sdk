import * as http from 'http';
import * as https from 'https';
import { v4 as uuidv4 } from 'uuid';

export class ClientException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClientException';
  }
}

export class Client {
  private apiKey: string;
  private url: string;
  private verbosity: string;

  constructor(apiKey: string, url: string, verbosity: string = "DEBUG") {
    this.apiKey = apiKey;
    this.url = url;
    this.verbosity = verbosity;
  }

  public warmup = async () => {
    return this.call('/_k/warmup', {}, {}, false);
  }

  public call = async (route: string, json: object = {}, headers: object = {}, retry = true, retryTimeoutMs = 300000) => {
    const endpoint = `${this.url.replace(/\/$/, '')}/${route.replace(/^\//, '')}`;

    headers = {
      'Content-Type': 'application/json',
      'X-BANANA-API-KEY': this.apiKey,
      'X-BANANA-REQUEST-ID': uuidv4(), // we use the same uuid to track all retries
      ...headers,
    }

    let MAX_BACKOFF_INTERVAL = 3000
    let backoffIntervalMs = 100;
    const start = Date.now();
    let firstCall = true;

    while (true) {
      if (Date.now() - start > retryTimeoutMs) {
        throw new ClientException('Retry timeout exceeded');
      }

      if (firstCall) {
        firstCall = false;
      } else {
        if (this.verbosity === "DEBUG") {
          console.log('Retrying...');
        }
      }

      backoffIntervalMs = Math.min(backoffIntervalMs*2, MAX_BACKOFF_INTERVAL); // at most wait MAX_BACKOFF_INTERVAL ms

      const res = await this.makeRequest(endpoint, json, headers);

      if (this.verbosity === "DEBUG" && res.statusCode !== 200) {
        console.log('Status code:', res.statusCode);
        console.log(res.body);
      }

      // success case -> return json and metadata
      if (res.statusCode === 200) {
        // parse res.headers of type http.IncomingHttpHeaders to object
        const meta = { headers: res.headers };
        try {
          const json = JSON.parse(res.body);
          
          return {json, meta};
        } catch {
          throw new ClientException(res.body);
        }
      
      } 
      
      // user at their quota -> retry
      else if (res.statusCode === 400) { // user at their quota, retry
        if (!retry) {
          throw new ClientException(res.body);
        }
        await this.sleep(backoffIntervalMs);
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
        await this.sleep(backoffIntervalMs);
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
        await this.sleep(backoffIntervalMs);
        continue;
      } 

      // gateway timeout
      else if (res.statusCode === 504) {
        const message = "Reached timeout limit of 5min. To avoid this we recommend using a app.background() handler."
        throw new ClientException(message);
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
        headers: {...headers,},
      }, (res: http.IncomingMessage) => {
        let body = '';

        res.on('data', (chunk: string) => {
          body += chunk;
        });

        res.on('end', () => {
          resolve({ statusCode: res.statusCode || 0, headers: res.headers, body });
        });
      });

      req.on('error', (error: Error) => {
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

type Project = {
  [key: string]: any
};
type Projects = {
  results: Project[]
}

export class API {
  private baseUrl: string = "https://api.banana.dev/v1";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
  }

  public listProjects = async (): Promise<{json: Projects, status: number}> => {
    return await this.makeRequest('GET', `${this.baseUrl}/projects`);
  }

  public getProject = async (projectId: string): Promise<{json: Project, status: number}> => {
    return await this.makeRequest('GET', `${this.baseUrl}/projects/${projectId}`);
  }

  public updateProject = async (projectId: string, data: object): Promise<{json: Project, status: number}> => {
    return await this.makeRequest('PUT', `${this.baseUrl}/projects/${projectId}`, data);
  }

  private makeRequest = async (method: string, url: string, data: object = {}, headers: object = {}): Promise<{json: any, status: number}> => {
    const res = await this.makeAPIRequest(method, url, data,  headers)
    
    return {json: JSON.parse(res.body), status: res.statusCode};
  }

  private makeAPIRequest = (method: string, url: string, data: object = {}, headers: object = {}) => {
    return new Promise<{ statusCode: number, headers: http.IncomingHttpHeaders, body: string }>((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      if (method == 'GET') {
        url += '?' + new URLSearchParams({...data}).toString();
      }
 
      const req = protocol.request(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-BANANA-API-KEY': this.apiKey,
          ...headers,
        },
      }, (res: http.IncomingMessage) => {
        let body = '';

        res.on('data', (chunk: string) => {
          body += chunk;
        });

        res.on('end', () => {
          resolve({ statusCode: res.statusCode || 0, headers: res.headers, body });
        });
      });

      req.on('error', (error: Error) => {
        reject(error);
      });

      if (method === 'POST' || method == 'PUT') {
        const json = JSON.stringify(data);
        req.write(json);
      }

      req.end();
    });
  };
}
