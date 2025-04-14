const GITHUB_API_BASE_URL = 'https://api.github.com';

/**
 * Creates a GitHub API client instance.
 * Reads the GitHub token from environment variables.
 *
 * @param token Optional explicit token to override environment variable.
 * @returns An object with methods to interact with the GitHub API.
 */
export async function createGitHubClient(token?: string) {
  const apiToken = token || process.env.GITHUB_TOKEN;

  if (!apiToken) {
    console.warn(
      'GitHub API token is not configured. Please set GITHUB_TOKEN in your .env.local file.'
    );
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (apiToken && apiToken !== 'YOUR_GITHUB_TOKEN_HERE') {
    headers['Authorization'] = `Bearer ${apiToken}`;
  }

  /**
   * Performs a fetch request to the GitHub API, handling common errors.
   * @param endpoint The API endpoint (e.g., /search/code).
   * @param options Fetch options.
   * @returns The JSON response.
   */
  async function githubFetch(endpoint: string, options: RequestInit = {}) {
    const url = `${GITHUB_API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    if (!response.ok) {
      // Basic rate limit check
      if (
        response.status === 403 &&
        response.headers.get('X-RateLimit-Remaining') === '0'
      ) {
        const resetTime = response.headers.get('X-RateLimit-Reset');
        const resetDate = resetTime
          ? new Date(parseInt(resetTime) * 1000)
          : null;
        console.error(
          `GitHub API rate limit exceeded. Resets at: ${resetDate?.toLocaleTimeString() ?? 'unknown'}`
        );
        throw new Error(
          `GitHub API rate limit exceeded. Resets at: ${resetDate?.toLocaleTimeString() ?? 'unknown'}`
        );
      }
      // General error handling
      const errorData = await response
        .json()
        .catch(() => ({ message: 'Unknown error' }));
      console.error(
        `GitHub API error (${response.status}): ${errorData.message || response.statusText}`
      );
      throw new Error(
        `GitHub API error: ${response.status} - ${errorData.message || response.statusText}`
      );
    }

    // Handle empty response body (e.g., 204 No Content)
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  }

  // --- API Methods ---

  /**
   * Searches for code on GitHub.
   * @param query The search query string (GitHub search syntax).
   * @returns The search results.
   */
  async function searchCode(query: string) {
    const endpoint = `/search/code?q=${encodeURIComponent(query)}`;
    return await githubFetch(endpoint, { method: 'GET' });
  }

  /**
   * Searches for repositories on GitHub.
   * @param query The search query string.
   * @returns The search results.
   */
  async function searchRepositories(query: string) {
    const endpoint = `/search/repositories?q=${encodeURIComponent(query)}`;
    return await githubFetch(endpoint, { method: 'GET' });
  }

  /**
   * Gets the contents of a file or directory in a repository.
   * @param owner The repository owner.
   * @param repo The repository name.
   * @param path The path to the file or directory.
   * @returns The file or directory contents.
   */
  async function getContents(owner: string, repo: string, path: string) {
    const endpoint = `/repos/${owner}/${repo}/contents/${path}`;
    return await githubFetch(endpoint, { method: 'GET' });
  }

  /**
   * Gets metadata for a specific repository.
   * @param owner The repository owner.
   * @param repo The repository name.
   * @returns The repository metadata.
   */
  async function getRepo(owner: string, repo: string) {
    const endpoint = `/repos/${owner}/${repo}`;
    return await githubFetch(endpoint, { method: 'GET' });
  }

  return {
    searchCode,
    searchRepositories,
    getContents,
    getRepo,
  };
}
