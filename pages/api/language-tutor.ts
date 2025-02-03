import type { NextApiRequest, NextApiResponse } from 'next';
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

interface WordExercise {
  word: string;
  definition: string;
  exampleSentence: string;
}

interface GrammarExercise {
  question: string;
  options: string[];
  correctAnswer: string;
}

interface FillerWordsCorrection {
  mistakes: string;
  fillerCount: number;
  correctedText: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { action, skillLevel, userInput } = req.body;

    switch (action) {
      case 'conversation':
        try {
          const aiResponse = await generateAIResponse(userInput, skillLevel);
          return res.status(200).json({ message: aiResponse });
        } catch (error) {
          console.error('Error generating AI response:', error);
          return res.status(500).json({ error: 'Failed to generate AI response' });
        }
      case 'vocabulary':
        try {
          const wordExercises = await generateWordExercises(skillLevel);
          return res.status(200).json(wordExercises);
        } catch (error) {
          console.error('Error generating word exercises:', error);
          return res.status(500).json({ error: 'Failed to generate word exercises' });
        }
      case 'grammar':
        try {
          const grammarExercise = await generateGrammarExercise(skillLevel);
          return res.status(200).json(grammarExercise);
        } catch (error) {
          console.error('Error generating grammar exercise:', error);
          return res.status(500).json({ error: 'Failed to generate grammar exercise' });
        }
      case 'fillerWords':
        try {
          const fillerCorrection = correctFillerWords(userInput);
          return res.status(200).json(fillerCorrection);
        } catch (error) {
          console.error('Error detecting filler words:', error);
          return res.status(500).json({ error: 'Failed to detect filler words' });
        }
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function generateAIResponse(input: string, skillLevel: string): Promise<string> {
  const prompt = `You are a helpful language tutor assisting a ${skillLevel} level student. 
  Respond to the following input in a way that's appropriate for their skill level: "${input}"`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'mixtral-8x7b-32768',
      temperature: 0.001,
      max_tokens: 30000
      ,
    });

    return completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error('Error calling Groq API:', error);
    throw new Error('Failed to generate AI response');
  }
}

async function generateWordExercises(skillLevel: string, count: number = 5): Promise<WordExercise[]> {
  const prompt = `Generate ${count} vocabulary word exercises for a ${skillLevel} level English learner. 
  Choose words that are contextual and relevant to the learner's skill level. 
  Provide each word's definition and an example sentence. Avoid basic words like "hello" or "goodbye". Format the response as a JSON array with the following structure:
  [
    {
      "word": "example1",
      "definition": "a short definition for example1",
      "exampleSentence": "An example sentence using example1."
    }
  ]`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'mixtral-8x7b-32768',
      temperature: 0.001,
      max_tokens: 3000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    const jsonString = jsonMatch ? jsonMatch[0] : response;
    const parsedResponse = JSON.parse(jsonString) as WordExercise[];

    return parsedResponse.filter(exercise =>
      exercise.word && exercise.definition && exercise.exampleSentence
    );
  } catch (error) {
    console.error('Error generating word exercises:', error);
    throw new Error('Failed to generate word exercises');
  }
}

async function generateGrammarExercise(skillLevel: string): Promise<GrammarExercise> {
  let prompt = '';
  if (skillLevel === 'Advanced') {
    prompt = `Generate an advanced grammar exercise for an English learner. 
    Focus on complex grammatical structures such as conditionals, passive voice, reported speech, or advanced tenses.
    Provide a challenging question with three options and the correct answer. Format the response as JSON with the following structure:
    {
      "question": "Complete the sentence with the correct form: If I ___ (know) about the party earlier, I would have attended.",
      "options": ["had known", "knew", "would know"],
      "correctAnswer": "had known"
    }`;
  } else if (skillLevel === 'Intermediate') {
    prompt = `Generate an intermediate level grammar exercise for an English learner. 
    Provide a question with three options and the correct answer. Example: “Choose the correct past tense: Yesterday, I ___ to the store.”`;
  } else {
    prompt = `Generate a beginner level grammar exercise for an English learner. 
    Provide a simple question with three options and the correct answer. Example: “Complete the sentence: I ___ (am/is/are) learning English.”`;
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'mixtral-8x7b-32768',
      temperature: 0.001,
      max_tokens: 3000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : response;
    const parsedResponse = JSON.parse(jsonString) as GrammarExercise;
    if (!parsedResponse.question || !Array.isArray(parsedResponse.options) || !parsedResponse.correctAnswer) {
      throw new Error('Invalid response structure');
    }
    return parsedResponse;
  } catch (error) {
    console.error('Error generating grammar exercise:', error);
    return createDefaultExercise(skillLevel);
  }
}

function createDefaultExercise(skillLevel: string): GrammarExercise {
  switch (skillLevel) {
    case 'Beginner':
      return {
        question: "Complete the sentence: I ___ a student.",
        options: ["am", "is", "are"],
        correctAnswer: "am"
      };
    case 'Intermediate':
      return {
        question: "Choose the correct past tense: Yesterday, I ___ to the store.",
        options: ["go", "went", "gone"],
        correctAnswer: "went"
      };
    case 'Advanced':
      return {
        question: "Select the correct conditional form: If I ___ about the exam, I would have studied more.",
        options: ["knew", "had known", "would know"],
        correctAnswer: "had known"
      };
    default:
      return {
        question: "Failed to generate a question. Please try again.",
        options: ["Option 1", "Option 2", "Option 3"],
        correctAnswer: "Option 1"
      };
  }
}

function correctFillerWords(input: string): FillerWordsCorrection {
  const fillerWords = ["um", "uh", "you know", "like", "so", "I mean", "well"];
  const words = input.split(/\s+/);  // Split input into words

  // Filter out the filler words and count them
  const fillerUsed = words.filter(word => fillerWords.includes(word.toLowerCase()));
  const fillerCount = fillerUsed.length;

  // Remove filler words from the original sentence
  const correctedText = words.filter(word => !fillerWords.includes(word.toLowerCase())).join(" ");

  return {
    fillerWords: fillerUsed.join(", "), // Join the filler words as a string
    fillerCount: fillerCount,
    correctedText: correctedText.trim() // Clean up any leading/trailing spaces
  };
}


