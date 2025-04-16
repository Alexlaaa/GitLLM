# SC4052 Cloud Computing

## Project Overview

This project is part of the SC4052 Cloud Computing course.

[Demonstration Video](https://www.youtube.com/watch?v=jk0nyHW25kw&ab_channel=Alex)

### Prerequisites

- Node.js installed
- npm or yarn installed
- Create a `.env.local` file in the `/frontend` directory with the following fields:

```env
# GitHub API Token 
GITHUB_TOKEN=your_github_token
# Gemini API Configuration
GEMINI_LLM_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
```

#### Setting up API Keys
##### GitHub API Token
1. Go to your GitHub account settings
2. Navigate to Developer Settings > Personal Access Tokens > Tokens (Classic) > Generate a new token (classic)
4. Give your token a descriptive name
5. For scopes, select `repo` to grant full access to repositories
Copy the token to your .env.local file

##### Google Gemini API
1. Create account or sign in to [Google AI Studio](https://aistudio.google.com/welcome)
2. Navigate to the API keys section
3. Generate a new API key
Copy the key to your .env.local file as GEMINI_LLM_API_KEY

Note: The default model is set to gemini-1.5-flash, but you can change this to another Gemini model if needed.
