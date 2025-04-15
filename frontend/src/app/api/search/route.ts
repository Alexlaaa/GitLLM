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

    const results = await githubResponse.json();

    return NextResponse.json({
      query: {
        originalQuery: query,
        transformedQuery: constructedUrl,
        explanation: parsedResponse.decision_details.reasoning,
      },
      results: results.items || [],
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
