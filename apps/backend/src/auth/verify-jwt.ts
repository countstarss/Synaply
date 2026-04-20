import { getAuthConfig } from './auth.config';

type JoseModule = Awaited<ReturnType<typeof loadJose>>;
type RemoteJwkSet = ReturnType<JoseModule['createRemoteJWKSet']>;

// Keep a statically analyzable jose reference so serverless bundlers include it.
// This function is never executed at runtime.
const traceJoseModuleForServerless = () => import('jose');
void traceJoseModuleForServerless;

let joseModulePromise: Promise<typeof import('jose')> | undefined;
const remoteJwkSetCache = new Map<string, RemoteJwkSet>();

export class JwtVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JwtVerificationError';
  }
}

function normalizeJwtVerificationError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown JWT verification error';
  }
}

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

async function getRemoteJwkSet(jwksUrl: string) {
  const cachedJwkSet = remoteJwkSetCache.get(jwksUrl);
  if (cachedJwkSet) {
    return cachedJwkSet;
  }

  const { createRemoteJWKSet } = await loadJose();
  const jwkSet = createRemoteJWKSet(new URL(jwksUrl));
  remoteJwkSetCache.set(jwksUrl, jwkSet);

  return jwkSet;
}

export async function verifyJwt(token: string) {
  const { jwtSecret, supabaseJwtIssuer, supabaseJwtJwksUrl } = getAuthConfig();

  try {
    const secretKey = new TextEncoder().encode(jwtSecret);
    const { decodeProtectedHeader, jwtVerify } = await loadJose();
    const { alg } = decodeProtectedHeader(token);

    if (!alg) {
      throw new Error('JWT header is missing alg');
    }

    const verificationOptions = {
      issuer: supabaseJwtIssuer,
      algorithms: [alg],
    };

    const { payload } =
      alg === 'HS256'
        ? await jwtVerify(token, secretKey, verificationOptions)
        : await jwtVerify(
            token,
            await getRemoteJwkSet(supabaseJwtJwksUrl),
            verificationOptions,
          );

    return payload;
  } catch (err) {
    const message = normalizeJwtVerificationError(err);
    console.error('JWT verification failed:', {
      message,
      issuer: supabaseJwtIssuer,
      jwksUrl: supabaseJwtJwksUrl,
    });
    throw new JwtVerificationError(message);
  }
}
