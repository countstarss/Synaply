import { getAuthConfig } from './auth.config';

let joseModulePromise: Promise<typeof import('jose')> | undefined;

function loadJose() {
  if (!joseModulePromise) {
    // Keep jose as a native ESM import so CommonJS builds still run on Vercel.
    joseModulePromise = new Function(
      'specifier',
      'return import(specifier)',
    )('jose') as Promise<typeof import('jose')>;
  }

  return joseModulePromise;
}

export async function verifyJwt(token: string) {
  const { jwtSecret, supabaseJwtIssuer } = getAuthConfig();

  try {
    const secretKey = new TextEncoder().encode(jwtSecret);
    const { jwtVerify } = await loadJose();

    const { payload } = await jwtVerify(token, secretKey, {
      issuer: supabaseJwtIssuer,
      algorithms: ['HS256'],
    });

    return payload;
  } catch (err) {
    console.error('JWT verification failed:', err);
    return null;
  }
}
