import { getAuthConfig } from './auth.config';

type JoseModule = Awaited<ReturnType<typeof loadJose>>;
type RemoteJwkSet = ReturnType<JoseModule['createRemoteJWKSet']>;

let joseModulePromise: Promise<typeof import('jose')> | undefined;
const remoteJwkSetCache = new Map<string, RemoteJwkSet>();

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
    console.error('JWT verification failed:', err);
    return null;
  }
}
