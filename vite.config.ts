import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function devApiPlugin() {
  return {
    name: 'dev-api-serverless-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/generate-word', async (req: any, res: any) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let bodyData = '';
        req.on('data', (chunk: any) => { bodyData += chunk; });
        req.on('end', async () => {
          try {
            const env = loadEnv('development', process.cwd(), '');
            process.env.GEMINI_API_KEY = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

            const { default: handler } = await server.ssrLoadModule('/api/generate-word.ts');

            const mockRes = {
              setHeader: (k: string, v: string) => res.setHeader(k, v),
              status: (code: number) => {
                res.statusCode = code;
                return mockRes;
              },
              json: (data: any) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              },
              end: () => res.end()
            };

            const mockReq = {
              method: req.method,
              body: bodyData ? JSON.parse(bodyData) : {}
            };

            await handler(mockReq, mockRes);
          } catch (err: any) {
            console.error('Dev API Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
          }
        });
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), devApiPlugin()],
});
