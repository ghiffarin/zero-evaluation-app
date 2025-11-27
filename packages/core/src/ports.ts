import net from 'net';

/**
 * Check if a port is available
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port, '127.0.0.1');
  });
}

/**
 * Find an available port starting from a preferred port
 */
export async function findAvailablePort(preferredPort: number, maxAttempts = 100): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = preferredPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`Could not find an available port after ${maxAttempts} attempts starting from ${preferredPort}`);
}

/**
 * Find available ports for frontend and backend
 * Ensures they don't conflict with each other
 */
export async function findAvailablePorts(
  preferredFrontend = 3000,
  preferredBackend = 3001
): Promise<{ frontend: number; backend: number }> {
  const frontend = await findAvailablePort(preferredFrontend);

  // Make sure backend port doesn't conflict with frontend
  let backendStart = preferredBackend;
  if (backendStart === frontend) {
    backendStart = frontend + 1;
  }

  const backend = await findAvailablePort(backendStart);

  return { frontend, backend };
}

/**
 * Check if a specific set of ports are all available
 */
export async function checkPortsAvailable(ports: number[]): Promise<{ port: number; available: boolean }[]> {
  const results = await Promise.all(
    ports.map(async (port) => ({
      port,
      available: await isPortAvailable(port),
    }))
  );
  return results;
}
