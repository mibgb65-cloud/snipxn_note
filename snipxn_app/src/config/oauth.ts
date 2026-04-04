export type OAuthProvider = 'github' | 'google';
export type OAuthAction = 'login' | 'bind';

const GITHUB_CLIENT_ID = 'Ov23liNGT98pOwffCrxV';

export const OAUTH_REDIRECT_URI = 'snipxn://oauth/callback';

export function getOAuthRedirectUri(): string {
  return OAUTH_REDIRECT_URI;
}

export function buildGitHubAuthorizeUrl(action: OAuthAction): string {
  const state = `github_${action}`;
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: OAUTH_REDIRECT_URI,
    scope: 'read:user user:email',
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export interface OAuthCallbackParams {
  code: string;
  provider: OAuthProvider;
  action: OAuthAction;
}

export function parseOAuthCallbackUrl(
  url: string,
): OAuthCallbackParams | null {
  if (!url.startsWith('snipxn://oauth/callback')) {
    return null;
  }

  const queryString = url.split('?')[1];
  if (!queryString) {
    return null;
  }

  const params = new URLSearchParams(queryString);
  const code = params.get('code');
  const state = params.get('state');

  if (!code || !state) {
    return null;
  }

  const [provider, action] = state.split('_') as [string, string];

  if (
    (provider !== 'github' && provider !== 'google') ||
    (action !== 'login' && action !== 'bind')
  ) {
    return null;
  }

  return { code, provider, action };
}
