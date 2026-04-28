const OpenAI = require('openai');

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const toSafeValue = (value) => (value === undefined || value === null || value === '' ? 'not provided' : value);

const formatUserContext = (user) => {
  return [
    `Age: ${toSafeValue(user?.age)}`,
    `Weight (kg): ${toSafeValue(user?.weight)}`,
    `Height (cm): ${toSafeValue(user?.height)}`,
    `Goal: ${toSafeValue(user?.goal)}`,
  ].join('\n');
};

const formatLogsContext = (logs = []) => {
  if (!Array.isArray(logs) || logs.length === 0) {
    return 'No food logs available.';
  }

  return logs
    .slice(0, 5)
    .map((log, index) => {
      const date = log?.date ? new Date(log.date).toISOString() : 'unknown date';
      return [
        `${index + 1}. ${toSafeValue(log?.foodName)} (${date})`,
        `   - Calories: ${toSafeValue(log?.calories)}`,
        `   - Protein: ${toSafeValue(log?.protein)}g`,
        `   - Carbs: ${toSafeValue(log?.carbs)}g`,
        `   - Fats: ${toSafeValue(log?.fats)}g`,
      ].join('\n');
    })
    .join('\n');
};

const createPrompt = (user, logs, message) => {
  return [
    'You are NutriTrack AI, a practical nutrition assistant.',
    'Give concise, actionable guidance based on the user profile and recent food logs.',
    'Do not provide diagnosis or medical treatment.',
    '',
    'User context:',
    formatUserContext(user),
    '',
    'Last 5 food logs:',
    formatLogsContext(logs),
    '',
    `User message: ${message}`,
  ].join('\n');
};

const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getAIResponse = async (user, logs, message) => {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw createError('Message is required.', 400);
  }

  if (!openaiClient) {
    throw createError('AI service is not configured. Please set OPENAI_API_KEY.', 503);
  }

  const prompt = createPrompt(user, logs, message.trim());

  try {
    const completion = await openaiClient.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.6,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful nutrition assistant for NutriTrack users.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const reply = completion?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      throw createError('AI provider returned an empty response.', 502);
    }

    return reply;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    const statusCode = error.status || 502;
    throw createError(`Failed to get AI response: ${error.message}`, statusCode);
  }
};

module.exports = { getAIResponse };
