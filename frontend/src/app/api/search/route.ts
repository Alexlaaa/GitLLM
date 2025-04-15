import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_LLM_API_KEY || '');

// --- Revamped Interface ---
interface SearchPlanResponse {
  searchPlan: {
    searchTarget: 'repositories' | 'code' | 'none'; // Target API endpoint
    githubQueryString: string; // Query string for GitHub API (without q=)
    queryAssessment: string; // Brief assessment of query suitability
    constructionRationale: string; // Explanation of how the query was built
    inferredIntent: string; // The user's likely goal
  };
}

// Define interface for GitHub Code Search API item
interface GitHubCodeSearchItem {
  sha: string;
  url: string;
  path: string;
  name: string;
  html_url: string;
  score: number;
  repository: {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    html_url: string;
    owner: {
      login: string;
      id: number;
      avatar_url: string;
      html_url: string;
    };
    stargazers_count?: number; 
    forks_count?: number; 
    language: string | null;
  };
}

// Define interface for GitHub Repository Search API item (simplified)
interface GitHubRepoSearchItem {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  owner: {
    login: string;
  };
  stargazers_count?: number;
  forks_count?: number;
  language: string | null;
  score?: number;
  url: string; 
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    console.log(`[API Route /api/search] Received query: "${query}"`); 

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // --- Revamped Prompt ---
    const prompt = `
    **Objective:** Transform a natural language query into an optimized GitHub Search API query string.

    **Context:** GitHub provides two primary search APIs relevant here:
    *   \`/search/code\`: Finds code snippets within files.
    *   \`/search/repositories\`: Finds repositories.

    **Your Task:**
    1.  **Analyze Intent:** Determine if the user wants to find specific code ('code' target) or repositories ('repositories' target). Default to 'code' unless the query strongly implies searching for repositories (e.g., mentions "repository", "project", or is a single word likely a username).
    2.  **Construct Query String:** Build the GitHub search query string based on the analyzed intent.
        *   **Keywords:** Extract the core search terms.
        *   **Qualifiers:** Intelligently apply relevant GitHub search qualifiers based on the natural language. Key qualifiers include:
            *   \`repo:owner/name\`: Use ONLY if a specific repository is clearly mentioned.
            *   \`user:username\`: Use for queries targeting a specific user's code/repos.
            *   \`language:lang\`: Use if a programming language is specified.
            *   \`path:path/to/dir\`: Use if a specific directory or path is mentioned.
            *   \`extension:ext\`: Use if a file extension is mentioned.
            *   \`in:file,path\`: Use if the query specifies searching within file contents or paths.
            *   Numeric/Date: \`stars:>\`, \`forks:>\`, \`size:>\`, \`created:>\`, \`pushed:>\`.
            *   Boolean: \`fork:true/only\`, \`archived:false\`.
        *   **Logical Operators:** Interpret "and", "or", "not" (and similar terms) using GitHub's \`AND\`, \`OR\`, \`NOT\` operators. \`AND\` is often implicit.
        *   **Syntax Rules:**
            *   Keywords first, then qualifiers (e.g., \`"database connection" repo:expressjs/express\`).
            *   Qualifiers format: \`qualifier:value\`.
            *   Separate all terms and qualifiers with spaces.
            *   If \`language:\` is used, do not repeat the language in the keywords.
            *   The final string MUST NOT include the \`q=\` prefix.
    3.  **Handle Ambiguity/Unsupported:**
        *   If the query is clearly unsupported (e.g., searching issues, users directly), set \`searchTarget\` to \`"none"\`.
        *   If the query is a single word likely a username, default to a repository search: \`searchTarget: "repositories"\`, \`githubQueryString: "user:username"\`.

    **Output Format:** Respond ONLY with a valid JSON object matching this exact structure:
    \`\`\`json
    {
      "searchPlan": {
        "searchTarget": "repositories" | "code" | "none",
        "githubQueryString": "The constructed query string (keywords + qualifiers)",
        "queryAssessment": "A brief evaluation of how well the query maps to GitHub search capabilities.",
        "constructionRationale": "Concise explanation of the chosen target, qualifiers, and any assumptions.",
        "inferredIntent": "A short summary of what the user is likely trying to achieve."
      }
    }
    \`\`\`

    **Example:**
    Natural language query: "Find express database connection examples not in tests"
    Expected JSON Output:
    \`\`\`json
    {
      "searchPlan": {
        "searchTarget": "code",
        "githubQueryString": "\\"express database connection examples\\" NOT path:test NOT path:tests",
        "queryAssessment": "Good mapping to code search with exclusion.",
        "constructionRationale": "Identified keywords 'express database connection examples'. Inferred exclusion of test directories using 'NOT path:'. Target is 'code' as user asks for examples.",
        "inferredIntent": "Find code examples for Express database connections, excluding test files."
      }
    }
    \`\`\`

    **User's Natural language query:** ${query}
    `;

    // Generate response from LLM
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    console.log('[API Route /api/search] Raw LLM response text:', text);

    // Parse the JSON response
    let parsedResponse: SearchPlanResponse; // Use new interface
    try {
      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsedResponse = JSON.parse(cleanedText);
      console.log('[API Route /api/search] Parsed LLM response:', JSON.stringify(parsedResponse, null, 2));
    } catch (parseError) {
      console.error('[API Route /api/search] Failed to parse LLM response:', text);
      console.error('[API Route /api/search] Parse error:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse LLM response' },
        { status: 500 }
      );
    }

    // --- Use new field names ---
    const searchTarget = parsedResponse.searchPlan.searchTarget;
    const githubQueryString = parsedResponse.searchPlan.githubQueryString;
    const constructionRationale = parsedResponse.searchPlan.constructionRationale; // For explanation
    const queryAssessment = parsedResponse.searchPlan.queryAssessment; // For feedback/unsupported

    if (searchTarget === 'none') {
       console.log('[API Route /api/search] LLM determined searchTarget is "none". Assessment:', queryAssessment);
      return NextResponse.json({
        query: {
          originalQuery: query,
          transformedQuery: '',
          explanation: queryAssessment, // Use assessment for 'none' feedback
        },
        results: [],
        endpoint: searchTarget, // Pass new name
        queryDetails: parsedResponse.searchPlan, // Pass new structure
      });
    }

    const githubApiUrl = `https://api.github.com/search/${searchTarget}?q=${encodeURIComponent(githubQueryString)}`;
    console.log(`[API Route /api/search] Calling GitHub API: ${githubApiUrl}`);

    const githubResponse = await fetch(githubApiUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    console.log(`[API Route /api/search] GitHub API response status: ${githubResponse.status}`);

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();
      console.error('[API Route /api/search] GitHub API error text:', errorText);
      return NextResponse.json(
        {
          query: {
            originalQuery: query,
            transformedQuery: githubQueryString,
            explanation: constructionRationale, // Use rationale for error explanation
          },
          error: `GitHub API error: ${githubResponse.status}`,
          errorDetails: errorText,
          endpoint: searchTarget,
          queryDetails: parsedResponse.searchPlan,
        },
        { status: githubResponse.status }
      );
    }

    const searchData = await githubResponse.json();
    console.log(`[API Route /api/search] GitHub API returned ${searchData.items?.length || 0} items.`);
    let finalResults = [];

    // --- Keep existing result processing logic ---
    if (searchTarget === 'code' && searchData.items) {
      const MAX_CONTENT_FETCHES = 10; 
      const contentFetchPromises = searchData.items
        .slice(0, MAX_CONTENT_FETCHES)
        .map(async (item: GitHubCodeSearchItem) => {
          try {
            const contentUrl = item.url; 
            const contentResponse = await fetch(contentUrl, {
              headers: {
                Accept: 'application/vnd.github+json', 
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                'X-GitHub-Api-Version': '2022-11-28',
              },
            });

            if (!contentResponse.ok) {
              console.warn(
                `[API Route /api/search] Failed to fetch content for ${item.path}: ${contentResponse.status}`
              ); 
              return { /* ... return item with placeholder ... */ 
                id: item.sha || item.url, 
                repository: { name: item.repository.name, full_name: item.repository.full_name, description: item.repository.description, html_url: item.repository.html_url, owner: item.repository.owner.login, stars: item.repository.stargazers_count || 0, forks: item.repository.forks_count || 0, language: item.repository.language, },
                path: item.path, name: item.name, url: item.url, html_url: item.html_url,
                codeSnippet: { code: '// Code snippet could not be fetched.', language: item.repository.language || 'plaintext', lineStart: 1, lineEnd: 1, },
                matchScore: item.score || 0, fullContent: '// Full content could not be fetched.',
              };
            }

            const contentData = await contentResponse.json();
            let fullContent = '// Content unavailable';
            if (contentData.content && contentData.encoding === 'base64') {
              try {
                fullContent = Buffer.from(contentData.content,'base64').toString('utf-8');
              } catch (decodeError) {
                console.error(`[API Route /api/search] Error decoding Base64 content for ${item.path}:`, decodeError); 
                fullContent = '// Error decoding content';
              }
            } else if (contentData.content) {
              fullContent = contentData.content;
            } else {
              console.warn(`[API Route /api/search] No 'content' field found or content is null/empty for ${item.path}`); 
            }

            const snippetLines = fullContent.split('\n').slice(0, 10).join('\n'); 
            return { /* ... return item with content ... */ 
              id: item.sha || item.url, 
              repository: { name: item.repository.name, full_name: item.repository.full_name, description: item.repository.description, html_url: item.repository.html_url, owner: item.repository.owner.login, stars: item.repository.stargazers_count || 0, forks: item.repository.forks_count || 0, language: item.repository.language, },
              path: item.path, name: item.name, url: item.url, html_url: item.html_url,
              codeSnippet: { code: snippetLines || '// Snippet unavailable', language: item.repository.language || 'plaintext', lineStart: 1, lineEnd: snippetLines.split('\n').length, },
              matchScore: item.score || 0, fullContent: fullContent || '// Content unavailable',
            };
          } catch (fetchError: unknown) { /* ... handle fetch error ... */ 
            const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
            console.error(`[API Route /api/search] Error fetching content for ${item.path}: ${errorMsg}`);
            return { /* ... return item with error indication ... */ 
              id: item.sha || item.url,
              repository: { name: item.repository.name, full_name: item.repository.full_name, description: item.repository.description, html_url: item.repository.html_url, owner: item.repository.owner.login, stars: item.repository.stargazers_count || 0, forks: item.repository.forks_count || 0, language: item.repository.language, },
              path: item.path, name: item.name, url: item.url, html_url: item.html_url,
              codeSnippet: { code: `// Error fetching snippet: ${errorMsg}`, language: 'plaintext', lineStart: 1, lineEnd: 1, },
              matchScore: item.score || 0, fullContent: `// Error fetching content: ${errorMsg}`,
            };
          }
        });

      const remainingItems = searchData.items
        .slice(MAX_CONTENT_FETCHES)
        .map((item: GitHubCodeSearchItem) => ({ /* ... map remaining items ... */ 
          id: item.sha || item.url,
          repository: { name: item.repository.name, full_name: item.repository.full_name, description: item.repository.description, html_url: item.repository.html_url, owner: item.repository.owner.login, stars: item.repository.stargazers_count || 0, forks: item.repository.forks_count || 0, language: item.repository.language, },
          path: item.path, name: item.name, url: item.url, html_url: item.html_url,
          codeSnippet: { code: '// Snippet not fetched (limit reached)', language: item.repository.language || 'plaintext', lineStart: 1, lineEnd: 1, },
          matchScore: item.score || 0, fullContent: '// Content not fetched (limit reached)',
        }));

      finalResults = [
        ...(await Promise.all(contentFetchPromises)),
        ...remainingItems,
      ];
    } else if (searchTarget === 'repositories' && searchData.items) {
      finalResults = searchData.items.map((item: GitHubRepoSearchItem) => ({ /* ... map repo items ... */ 
        id: item.id,
        repository: { name: item.name, full_name: item.full_name, description: item.description, html_url: item.html_url, owner: item.owner.login, stars: item.stargazers_count || 0, forks: item.forks_count || 0, language: item.language, },
        path: '', name: item.name, url: item.url, html_url: item.html_url,
        codeSnippet: { code: '', language: '', lineStart: 0, lineEnd: 0 }, 
        matchScore: item.score || 0, fullContent: '',
      }));
    }

    return NextResponse.json({
      query: {
        originalQuery: query,
        transformedQuery: githubQueryString, // Use new name
        explanation: constructionRationale, // Use new name
      },
      results: finalResults, 
      endpoint: searchTarget, // Use new name
      queryDetails: parsedResponse.searchPlan, // Use new structure/name
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[API Route /api/search] Error processing search:', errorMessage);
    return NextResponse.json(
      { error: `Failed to process search request: ${errorMessage}` },
      { status: 500 }
    );
  }
}
