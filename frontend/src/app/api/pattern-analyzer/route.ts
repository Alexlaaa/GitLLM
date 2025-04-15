import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_LLM_API_KEY || "");

interface PatternAnalysisResult {
  similarityScore: number;
  insights: string;
  highlightedDifferences: string[];
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

    if (!codePattern || typeof codePattern !== "string" || codePattern.trim() === "") {
      return NextResponse.json(
        { error: "Code pattern is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Construct GitHub search query for code pattern
    // We need to find similar patterns while limiting to specific language if provided
    let searchQuery = `${codePattern.substring(0, 200)}`; // Using first 200 chars as GitHub limits query length
    
    if (language) {
      searchQuery += ` language:${language}`;
    }
    
    // Add any additional filters
    if (filters) {
      if (filters.stars) {
        searchQuery += ` stars:>${filters.stars}`;
      }
      if (filters.forks) {
        searchQuery += ` forks:>${filters.forks}`;
      }
      if (filters.repoFilter) {
        searchQuery += ` repo:${filters.repoFilter}`;
      }
      if (filters.userFilter) {
        searchQuery += ` user:${filters.userFilter}`;
      }
    }

    // Execute GitHub search for code patterns
    const githubApiUrl = `https://api.github.com/search/code?q=${encodeURIComponent(searchQuery)}`;
    
    const githubResponse = await fetch(githubApiUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!githubResponse.ok) {
      const errorText = await githubResponse.text();
      console.error("GitHub API error:", errorText);
      return NextResponse.json(
        { error: `GitHub API error: ${githubResponse.status}` },
        { status: githubResponse.status }
      );
    }

    const searchResults = await githubResponse.json();
    const items = searchResults.items || [];

    // For each result, fetch the full file content to perform analysis
    const fullResults = await Promise.all(
      items.slice(0, 5).map(async (item: GitHubCodeSearchItem) => {
        // Get full content URL
        const contentUrl = item.url;
        
        try {
          const contentResponse = await fetch(contentUrl, {
            headers: {
              Accept: "application/vnd.github+json",
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
              "X-GitHub-Api-Version": "2022-11-28",
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
            : "";

          // Get repository details
          const repoUrl = item.repository.url;
          const repoResponse = await fetch(repoUrl, {
            headers: {
              Accept: "application/vnd.github+json",
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
              "X-GitHub-Api-Version": "2022-11-28",
            },
          });

          const repoData = await repoResponse.json();

          // Use LLM to analyze the code pattern differences
          const analysisResult = await analyzeCodePatterns(codePattern, content);

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
    console.error("Error analyzing pattern:", errorMessage);
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
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  // Create prompt for LLM
  const prompt = `
  As a code analysis expert, compare these two code snippets and provide insights:

  SOURCE CODE:
  \`\`\`
  ${sourceCode}
  \`\`\`

  TARGET CODE:
  \`\`\`
  ${targetCode}
  \`\`\`

  1. Provide a similarity score from 0-100
  2. Analyze key differences in implementation approach
  3. Identify any best practices present in either snippet
  4. Note any potential issues or improvements
  5. List the specific differences in a concise way

  Return your analysis in the following JSON format with no additional text:
  {
    "similarityScore": number,
    "insights": "Your detailed analysis here describing differences in implementation approach, best practices, and potential improvements",
    "highlightedDifferences": ["Specific difference 1", "Specific difference 2", ...]
  }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parse the JSON response
    const analysisResult = JSON.parse(text) as PatternAnalysisResult;
    return analysisResult;
  } catch (error) {
    console.error("Error analyzing code patterns:", error);
    return {
      similarityScore: 0,
      insights: "Failed to analyze code patterns",
      highlightedDifferences: ["Analysis failed"],
    };
  }
}
