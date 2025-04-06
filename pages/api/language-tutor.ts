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
  fillerCount: number;
  fillersUsed: string[];
  correctedText: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { action, skillLevel, userInput } = req.body;

    switch (action) {
      case 'conversation':
        try {
          const aiResponse = await generateAIResponse(userInput);
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

async function generateAIResponse(input: string): Promise<string> {
  const prompt = `Correct only the mistakes in this sentence.
  Identify and list the grammar mistakes along with their corrections.
  Count and list the filler words used.
  Analyze the sentiment of the sentence and provide a confidence level.
  Do not provide explanations.
  Return the response in the following format:
  
  Corrected Sentence: [Corrected sentence here]
  Grammar Mistakes: [mistake1 → correction1, mistake2 → correction2]
  Filler Count: [number]
  Fillers Used: [word1, word2, word3]
  Sentiment: [Positive/Negative/Neutral]
  Confidence Level: [High/Medium/Low]
  
  Sentence: "${input}"`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-70b-8192', // Updated model
      temperature: 0.001,
      max_tokens: 300,
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
  Provide each word's definition and an example sentence. Avoid basic words like "hello" or "goodbye". 
  Format the response as a JSON array:
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
      model: 'llama3-70b-8192',
      temperature: 0.001,
      max_tokens: 3000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from AI');

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : response) as WordExercise[];
  } catch (error) {
    console.error('Error generating word exercises:', error);
    throw new Error('Failed to generate word exercises');
  }
}
