import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_LLM_API_KEY || '');

interface SearchResponse {
  decision_details: {
    endpoint: 'repositories' | 'code' | 'none';
    constructed_url: string;
    feedback: string;
    reasoning: string;
    intention: string;
  };
  evaluation: {
    quality: 'high' | 'medium' | 'low';
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
    stargazers_count?: number; // Optional as it might not always be present
    forks_count?: number;     // Optional
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
  url: string; // Added URL for consistency
}


export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Use the Gemini LLM API to transform the query into GitHub search syntax
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
    You are a specialized assistant that converts natural language queries about GitHub repositories and code into GitHub API search queries. GitHub offers two search endpoints:
    1. \`/search/repositories\` – for finding repositories.
    2. \`/search/code\` – for finding code within repositories.

    Your task is to:

    1. **Determine the query type:** Identify whether the user's query is focused on repositories or code. If the user's query appears to be a single word (which may be a GitHub username), assume the intention is to search for repositories owned by that user using the qualifier \`user:<username>\`.
    
    2. **Construct the query:** Translate the natural language query into a GitHub API search query string with appropriate parameters and qualifiers. Follow these specific formatting rules:
       - Always use "qualifier:value" format (e.g., \`language:javascript\`, \`user:username\`)
       - Separate qualifiers with spaces, NOT plus signs
       - Common qualifiers: \`language:\`, \`user:\`, \`repo:\`, \`stars:>1000\`, \`created:>2022-01-01\`, \`extension:\`, \`path:\`, \`size:<1000\`
       - Place search terms BEFORE any qualifiers (e.g., "react component language:javascript")
       - If using language qualifier, do NOT include the language name in the search terms
       - Do not include the prefix \`q=\` in the constructed URL
    
    3. **Handle unsupported queries:** If the query cannot be served by these two endpoints, return a JSON response that explains why.

    **Return Format:**  
    Always return a valid JSON object that exactly matches the following structure. Do not include any additional keys or markdown formatting:

    {
      "decision_details": {
        "endpoint": "repositories | code | none",
        "constructed_url": "the constructed search query string (without q= prefix)",
        "feedback": "brief explanation of how well the query matches GitHub search capabilities",
        "reasoning": "detailed explanation of the parameter choices and any assumptions made",
        "intention": "interpreted user intention"
      },
      "evaluation": {
        "quality": "high | medium | low"
      }
    }

    Natural language query: ${query}
    
    IMPORTANT: For a query like "Find Python code for house robber problem", the constructed_url should be "house robber problem language:python" NOT "python house robber language:python" to avoid confusion with the language qualifier.
    `;

    // Generate response from LLM
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON response
    let parsedResponse: SearchResponse;
    try {
      // Clean up the response by removing markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse LLM response:", text);
      console.error("Parse error:", parseError);
      return NextResponse.json(
        { error: "Failed to parse LLM response" },
        { status: 500 }
      );
    }

    // Execute GitHub search using the constructed query
    const endpoint = parsedResponse.decision_details.endpoint;
    const constructedUrl = parsedResponse.decision_details.constructed_url;

    if (endpoint === 'none') {
      return NextResponse.json({
        query: {
          originalQuery: query,
          transformedQuery: '',
          explanation: parsedResponse.decision_details.feedback,
        },
        results: [],
        endpoint: endpoint,
        queryDetails: parsedResponse,
      });
    }

    // Execute GitHub search
    const githubApiUrl = `https://api.github.com/search/${endpoint}?q=${encodeURIComponent(constructedUrl)}`;

    const githubResponse = await fetch(githubApiUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();
      console.error('GitHub API error:', errorText);
      
      // Return more detailed error information to the client
      return NextResponse.json({
        query: {
          originalQuery: query,
          transformedQuery: constructedUrl,
          explanation: parsedResponse.decision_details.reasoning,
        },
        error: `GitHub API error: ${githubResponse.status}`,
        errorDetails: errorText,
        endpoint: endpoint,
        queryDetails: parsedResponse,
      }, { status: githubResponse.status });
    }

    const searchData = await githubResponse.json();
    let finalResults = [];

    if (endpoint === 'code' && searchData.items) {
      // Fetch content for the top N code results
      const MAX_CONTENT_FETCHES = 10; // Limit to avoid rate limits/long waits
      const contentFetchPromises = searchData.items.slice(0, MAX_CONTENT_FETCHES).map(async (item: GitHubCodeSearchItem) => {
        console.log(`[API Route] Processing item: ${item.path} (URL: ${item.url})`); // LOGGING Start
        try {
          const contentUrl = item.url; // Use the item's API URL for content details
          console.log(`[API Route] Fetching content from: ${contentUrl}`); // LOGGING Fetch URL
          const contentResponse = await fetch(contentUrl, {
            headers: {
              Accept: 'application/vnd.github+json', // Fetch JSON details
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
              'X-GitHub-Api-Version': '2022-11-28',
            },
          });

          console.log(`[API Route] Content fetch status for ${item.path}: ${contentResponse.status}`); // LOGGING Fetch Status

          if (!contentResponse.ok) {
            // Handle cases where content cannot be fetched (e.g., large files, permissions)
            console.warn(`[API Route] Failed to fetch content for ${item.path}: ${contentResponse.status}`); // LOGGING Fetch Fail
            // Return the item with placeholder content
             return {
              id: item.sha || item.url, // Use sha or url as a unique ID
              repository: {
                name: item.repository.name,
                full_name: item.repository.full_name,
                description: item.repository.description,
                html_url: item.repository.html_url,
                owner: item.repository.owner.login,
                stars: item.repository.stargazers_count || 0, // Ensure stars is a number
                forks: item.repository.forks_count || 0, // Ensure forks is a number
                language: item.repository.language,
              },
              path: item.path,
              name: item.name,
              url: item.url,
              html_url: item.html_url,
              codeSnippet: {
                code: "// Code snippet could not be fetched.",
                language: item.repository.language || 'plaintext', // Use repo language or default
                lineStart: 1, // Placeholder
                lineEnd: 1,   // Placeholder
              },
              matchScore: item.score || 0,
              fullContent: "// Full content could not be fetched.",
            };
          }

          const contentData = await contentResponse.json();
          console.log(`[API Route] Received content data keys for ${item.path}:`, Object.keys(contentData)); // LOGGING Received Data Keys

          // Decode Base64 content
          let fullContent = "// Content unavailable";
          let decodeSuccess = false;
          if (contentData.content && contentData.encoding === 'base64') {
             try {
               fullContent = Buffer.from(contentData.content, 'base64').toString('utf-8');
               decodeSuccess = true;
               console.log(`[API Route] Successfully decoded Base64 content for ${item.path}`); // LOGGING Decode Success
             } catch (decodeError) {
               console.error(`[API Route] Error decoding Base64 content for ${item.path}:`, decodeError); // LOGGING Decode Error
               fullContent = "// Error decoding content";
             }
          } else if (contentData.content) {
             // Handle potential non-base64 content if API changes, though unlikely
             fullContent = contentData.content;
             console.log(`[API Route] Received non-Base64 content for ${item.path}`); // LOGGING Non-Base64
          } else {
             console.warn(`[API Route] No 'content' field found or content is null/empty for ${item.path}`); // LOGGING No Content Field
          }

          const snippetLines = fullContent.split('\n').slice(0, 10).join('\n'); // First 10 lines as snippet
          console.log(`[API Route] Generated snippet for ${item.path} (Decode Success: ${decodeSuccess}): "${snippetLines.substring(0, 50)}..."`); // LOGGING Snippet

          return {
            id: item.sha || item.url, // Use sha or url as a unique ID
            repository: {
              name: item.repository.name,
              full_name: item.repository.full_name,
              description: item.repository.description,
              html_url: item.repository.html_url,
              owner: item.repository.owner.login,
              stars: item.repository.stargazers_count || 0, // Ensure stars is a number
              forks: item.repository.forks_count || 0, // Ensure forks is a number
              language: item.repository.language,
            },
            path: item.path,
            name: item.name,
            url: item.url,
            html_url: item.html_url,
            codeSnippet: {
              code: snippetLines || "// Snippet unavailable",
              language: item.repository.language || 'plaintext', // Use repo language or default
              lineStart: 1, // Placeholder, actual line numbers not available from search
              lineEnd: snippetLines.split('\n').length, // Placeholder
            },
            matchScore: item.score || 0,
            fullContent: fullContent || "// Content unavailable",
          };
        } catch (fetchError: unknown) {
          const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
          console.error(`Error fetching content for ${item.path}: ${errorMsg}`);
          // Return item with error indication
          return {
            id: item.sha || item.url,
            repository: {
              name: item.repository.name,
              full_name: item.repository.full_name,
              description: item.repository.description,
              html_url: item.repository.html_url,
              owner: item.repository.owner.login,
              stars: item.repository.stargazers_count || 0,
              forks: item.repository.forks_count || 0,
              language: item.repository.language,
            },
            path: item.path,
            name: item.name,
            url: item.url,
            html_url: item.html_url,
            codeSnippet: { code: `// Error fetching snippet: ${errorMsg}`, language: 'plaintext', lineStart: 1, lineEnd: 1 },
            matchScore: item.score || 0,
            fullContent: `// Error fetching content: ${errorMsg}`,
          };
        }
      });

      // Add remaining items without content fetching
      const remainingItems = searchData.items.slice(MAX_CONTENT_FETCHES).map((item: GitHubCodeSearchItem) => ({
         id: item.sha || item.url,
         repository: {
           name: item.repository.name,
           full_name: item.repository.full_name,
           description: item.repository.description,
           html_url: item.repository.html_url,
           owner: item.repository.owner.login,
           stars: item.repository.stargazers_count || 0,
           forks: item.repository.forks_count || 0,
           language: item.repository.language,
         },
         path: item.path,
         name: item.name,
         url: item.url,
         html_url: item.html_url,
         codeSnippet: { code: "// Snippet not fetched (limit reached)", language: item.repository.language || 'plaintext', lineStart: 1, lineEnd: 1 },
         matchScore: item.score || 0,
         fullContent: "// Content not fetched (limit reached)",
      }));

      finalResults = [...(await Promise.all(contentFetchPromises)), ...remainingItems];

    } else if (endpoint === 'repositories' && searchData.items) {
      // Map repository search results (no code content needed)
      finalResults = searchData.items.map((item: GitHubRepoSearchItem) => ({
        id: item.id,
        repository: {
          name: item.name,
          full_name: item.full_name,
          description: item.description,
          html_url: item.html_url,
          owner: item.owner.login,
          stars: item.stargazers_count || 0,
          forks: item.forks_count || 0,
          language: item.language,
        },
        // Add dummy values for code-specific fields if needed by frontend type
        path: '',
        name: '',
        url: item.url,
        html_url: item.html_url,
        codeSnippet: { code: '', language: '', lineStart: 0, lineEnd: 0 },
        matchScore: item.score || 0,
        fullContent: '',
      }));
    }


    return NextResponse.json({
      query: {
        originalQuery: query,
        transformedQuery: constructedUrl,
        explanation: parsedResponse.decision_details.reasoning,
      },
      results: finalResults, // Use the processed results
      endpoint: endpoint,
      queryDetails: parsedResponse,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error processing search:', errorMessage);
    return NextResponse.json(
      { error: `Failed to process search request: ${errorMessage}` },
      { status: 500 }
    );
  }
}
