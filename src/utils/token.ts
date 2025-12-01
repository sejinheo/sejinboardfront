const ACCESS_TOKEN_KEY = 'accessToken';

export const tokenUtils = {
  
  getAccessToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken: (token: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  removeAccessToken: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'refreshToken') {
        return decodeURIComponent(value);
      }
    }
    return null;
  },

  setRefreshToken: (token: string): void => {

    document.cookie = `refreshToken=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
  },

  removeRefreshToken: (): void => {

    document.cookie = 'refreshToken=; path=/; max-age=0';
  },

  clearAll: (): void => {
    tokenUtils.removeAccessToken();
    tokenUtils.removeRefreshToken();
  },
};
