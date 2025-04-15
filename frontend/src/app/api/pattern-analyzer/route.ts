import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
// Using the stable "gemini-pro" model for code analysis
const genAI = new GoogleGenerativeAI(process.env.GEMINI_LLM_API_KEY || '');

interface PatternAnalysisResult {
  insights: string;
  technicalAnalysis: string;
  bestPractices: string;
  improvementAreas: string;
  overallScore: number; // 1-100 score for implementation quality
}

interface GitHubCodeSearchItem {
  url: string;
  name: string;
  path: string;
  score: number;
  repository: {
    url: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { codePattern, language, filters } = await request.json();

    if (
      !codePattern ||
      typeof codePattern !== 'string' ||
      codePattern.trim() === ''
    ) {
      return NextResponse.json(
        { error: 'Code pattern is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Construct GitHub search query for code pattern
    // We need to find similar patterns while limiting to specific language if provided
    let searchQuery = `${codePattern.substring(0, 200)}`; // Using first 200 chars as GitHub limits query length

    if (language) {
      searchQuery += ` language:${language}`;
    }

    // Add user filter directly to search query
    if (filters && filters.userFilter) {
      searchQuery += ` user:${filters.userFilter}`;
    }
    
    // Add repository filter with proper format validation
    if (filters && filters.repoFilter) {
      // GitHub requires repo filter in exact format "owner/repo"
      const repoPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
      if (repoPattern.test(filters.repoFilter)) {
        searchQuery += ` repo:${filters.repoFilter}`;
        console.log(`Adding repo filter: repo:${filters.repoFilter}`);
      } else {
        console.warn(`Invalid repo format: ${filters.repoFilter}, must be owner/repo`);
      }
    }

    // Note: stars and forks filters will be applied after fetching results
    // since GitHub's code search API doesn't directly support these qualifiers

    // Execute GitHub search for code patterns
    const githubApiUrl = `https://api.github.com/search/code?q=${encodeURIComponent(searchQuery)}`;

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
      return NextResponse.json(
        { error: `GitHub API error: ${githubResponse.status}` },
        { status: githubResponse.status }
      );
    }

    const searchResults = await githubResponse.json();
    const items = searchResults.items || [];

    // Increase limit to 10 results (was 5)
    const MAX_RESULTS = 10;
    
    // For each result, fetch the full file content to perform analysis
    const fullResults = await Promise.all(
      items.slice(0, MAX_RESULTS).map(async (item: GitHubCodeSearchItem) => {
        // Get full content URL
        const contentUrl = item.url;

        try {
          const contentResponse = await fetch(contentUrl, {
            headers: {
              Accept: 'application/vnd.github+json',
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
              'X-GitHub-Api-Version': '2022-11-28',
            },
          });

          if (!contentResponse.ok) {
            console.error(`Failed to fetch content for ${contentUrl}`);
            return null;
          }

          const contentData = await contentResponse.json();

          // GitHub API returns content as base64 encoded
          const content = contentData.content
            ? Buffer.from(contentData.content, 'base64').toString('utf-8')
            : '';

          // Get repository details
          const repoUrl = item.repository.url;
          const repoResponse = await fetch(repoUrl, {
            headers: {
              Accept: 'application/vnd.github+json',
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
              'X-GitHub-Api-Version': '2022-11-28',
            },
          });

          const repoData = await repoResponse.json();

          // Use LLM to analyze the code pattern differences
          const analysisResult = await analyzeCodePatterns(
            codePattern,
            content
          );

          return {
            score: item.score,
            name: item.name,
            path: item.path,
            repository: {
              name: repoData.name,
              full_name: repoData.full_name,
              description: repoData.description,
              url: repoData.html_url,
              stars: repoData.stargazers_count,
              forks: repoData.forks_count,
              language: repoData.language,
            },
            codeContent: content,
            analysis: analysisResult,
          };
        } catch {
          return null;
        }
      })
    );

    // Filter out null results
    const validResults = fullResults.filter(Boolean);

    return NextResponse.json({
      query: searchQuery,
      results: validResults,
      totalCount: searchResults.total_count,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error analyzing pattern:', errorMessage);
    return NextResponse.json(
      { error: `Failed to analyze code pattern: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Function to analyze code patterns using LLM
async function analyzeCodePatterns(
  sourceCode: string,
  targetCode: string
): Promise<PatternAnalysisResult> {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || '',
  });

  // Create prompt for LLM
  const prompt = `
  As a senior code analyst, analyze these code snippets in detail and provide comprehensive insights:

  SOURCE CODE (User's Code):
  \`\`\`
  ${sourceCode}
  \`\`\`

  TARGET CODE (GitHub Implementation):
  \`\`\`
  ${targetCode}
  \`\`\`

  Perform a deep professional analysis of the above code samples. Your analysis should be thorough, technically precise, and educational.

  IMPORTANT: You must return your response as a raw JSON object without ANY markdown formatting, code blocks, or additional text.
  DO NOT use \`\`\`json or any other markdown formatting in your response.
  Return ONLY the JSON object itself starting with { and ending with } and nothing else.

  Your response should follow this structure:
  {
    "insights": "Give a high-level overview of what this code does, its purpose, and key functionality. Explain the pattern demonstrated and how both implementations approach the same problem. Include any notable differences in philosophy or design approach.",
    
    "technicalAnalysis": "Provide a comprehensive technical analysis of the target implementation. Explain how the implementation works including algorithms, data structures, language features and techniques used. Compare implementation approaches between source and target code, discussing patterns, paradigms, and potential tradeoffs. Evaluate whether certain approaches might work better in different contexts.",
    
    "bestPractices": "Highlight best practices demonstrated in the target code. Note any performance optimizations, security considerations, maintainability improvements, or other quality aspects. Suggest what the user could learn from this implementation. If there are no notable best practices, it's okay to mention that.",
    
    "improvementAreas": "Identify potential issues, anti-patterns, or areas that could be improved in the target code. Consider performance concerns, edge cases, security vulnerabilities, or maintainability issues. Provide specific suggestions for improvement where possible. If there are no obvious areas for improvement, it's perfectly fine to state that the implementation is solid and doesn't have clear issues to address.",
    
    "overallScore": Give a numerical score from 1-100 that represents the overall quality of this implementation compared to the user's code pattern. Consider code quality, best practices, efficiency, maintainability, and how well it solves the intended problem. Higher scores (80-100) indicate exceptional implementations, medium scores (50-79) indicate solid implementations with some room for improvement, and lower scores (below 50) indicate implementations with significant issues or that poorly match the intended use case.
  }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    // Sanitize the response text to remove any potential markdown formatting
    // Remove markdown code block indicators if present
    text = text.replace(/```json\s*/g, '');
    text = text.replace(/```\s*$/g, '');
    // Trim whitespace to ensure clean JSON
    text = text.trim();

    console.log('Processing response:', text.substring(0, 100) + '...'); // Log beginning of response

    // Parse the sanitized JSON response
    const analysisResult = JSON.parse(text) as PatternAnalysisResult;
    return analysisResult;
  } catch (error) {
    console.error('Error analyzing code patterns:', error);
    return {
      insights: 'Failed to analyze code patterns',
      technicalAnalysis: 'Analysis could not be completed due to a technical error. Unable to compare implementations at this time.',
      bestPractices: 'Analysis was not successful, please try again.',
      improvementAreas: 'Could not identify improvement areas due to analysis failure.',
      overallScore: 0, // Default score for failed analysis
    };
  }
}
