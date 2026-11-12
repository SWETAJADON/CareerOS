const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

let aiClient;

async function getAIClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from backend/.env");
  }

  if (!aiClient) {
    const { GoogleGenAI } = await import("@google/genai");

    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  return aiClient;
}

const generateResumeContent = async (
  profile,
  targetRole,
  additionalInfo = ""
) => {
  const ai = await getAIClient();

  const prompt = `
You are CareerOS, a professional AI resume-writing assistant.

Generate professional and ATS-conscious resume content.

TARGET ROLE:
${targetRole}

CANDIDATE PROFILE:
${JSON.stringify(profile, null, 2)}

ADDITIONAL INFORMATION:
${additionalInfo}

IMPORTANT RULES:
1. Never invent qualifications, experience, companies, dates,
   achievements, certifications or skills.
2. Improve grammar and professional wording.
3. Keep all candidate information truthful.
4. Return empty arrays or strings for missing information.
5. Tailor content to the target job role.
6. Return valid JSON only. Do not include Markdown.

Use exactly this JSON structure:

{
  "title": "Resume title",
  "summary": "Professional summary",
  "skills": [],
  "experience": [
    {
      "company": "",
      "position": "",
      "duration": "",
      "description": ""
    }
  ],
  "projects": [
    {
      "name": "",
      "technologies": "",
      "description": ""
    }
  ],
  "suggestions": []
}
`;

  const response = await ai.interactions.create({
    model: "gemini-3.5-flash-lite",
    input: prompt,
  });

  const output = response.output_text;

  if (!output) {
    throw new Error("Gemini returned an empty response.");
  }

  return JSON.parse(output);
};

module.exports = { generateResumeContent };
