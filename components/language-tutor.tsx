"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, BookOpen, PenTool, Send, User, Bot, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const skillLevels = ["Beginner", "Intermediate", "Advanced"];

type ConversationEntry = {
  speaker: "User" | "AI";
  message: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

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

export function LanguageTutorComponent() {
  const [skillLevel, setSkillLevel] = useState<string>("Beginner");
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [userInput, setUserInput] = useState<string>("");

  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  const [currentWordExercise, setCurrentWordExercise] = useState<WordExercise | null>(null);
  const [currentGrammarExercise, setCurrentGrammarExercise] = useState<GrammarExercise | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [wordError, setWordError] = useState<string | null>(null);
  const [isLoadingWord, setIsLoadingWord] = useState(false);
  const [wordExercises, setWordExercises] = useState<WordExercise[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Speech-to-text state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize the Speech Recognition API
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      setRecognition(recognitionInstance);

      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');
        setUserInput(transcript);
      };

      recognitionInstance.onerror = (event) => {
        setSpeechError('Error occurred in speech recognition: ' + event.error);
      };
    } else {
      setSpeechError('Speech Recognition is not supported in this browser.');
    }
  }, []);

  useEffect(() => {
    fetchWords();
    fetchExercise();
  }, [skillLevel]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const fetchWords = async () => {
    setIsLoadingWord(true);
    try {
      const response = await fetch(`${API_URL}/language-tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vocabulary', skillLevel }),
      });
      const data = await response.json();
      if (response.ok) {
        setWordExercises(data);
        setCurrentWordIndex(0);
        setWordError(null);
      } else {
        setWordError(data.error || 'Failed to fetch words');
        setWordExercises([]);
      }
    } catch (error) {
      setWordError('Failed to fetch words');
      setWordExercises([]);
    } finally {
      setIsLoadingWord(false);
    }
  };

  const fetchExercise = async () => {
    try {
      const response = await fetch(`${API_URL}/language-tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'grammar', skillLevel }),
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentGrammarExercise(data);
        setSelectedAnswer(null);
        setIsAnswerCorrect(null);
        setError(null); // Clear any previous errors
      } else {
        setError(data.error || 'Failed to fetch exercise');
        setCurrentGrammarExercise(null);
      }
    } catch (error) {
      setError('Failed to fetch exercise');
      setCurrentGrammarExercise(null);
    }
  };

  const handleConversationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    try {
      const response = await fetch(`${API_URL}/language-tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'conversation', userInput }),
      });
      const data = await response.json();
      if (response.ok) {
        const newConversation: ConversationEntry[] = [
          ...conversation,
          { speaker: 'User', message: userInput },
          { speaker: 'AI', message: data.message },
        ];
        setConversation(newConversation);
        setUserInput('');
        updateProgress();
      } else {
        setError(data.error || 'Failed to get AI response');
      }
    } catch (error) {
      setError('Failed to get AI response');
    }
  };

  const handleNextWord = () => {
    if (currentWordIndex < wordExercises.length - 1) {
      setCurrentWordIndex((prevIndex) => prevIndex + 1);
    } else {
      fetchWords(); // Fetch more words if we're at the end of the list
    }
    updateProgress();
  };

  const handleNextExercise = () => {
    fetchExercise();
    updateProgress();
  };

  const updateProgress = () => {
    setProgress((prevProgress) => Math.min(prevProgress + 10, 100));
  };

  const scrollToBottom = () => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAnswerSubmit = () => {
    if (currentGrammarExercise && selectedAnswer) {
      const isCorrect = selectedAnswer === currentGrammarExercise.correctAnswer;
      setIsAnswerCorrect(isCorrect);
      if (isCorrect) {
        updateProgress();
      }
    }
  };

  const handleStartRecording = () => {
    if (recognition) {
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleStopRecording = () => {
    if (recognition) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-r from-red-500 via-blue-600 to-red-500 p-6 flex flex-col items-center justify-center">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-5xl font-extrabold mb-8 text-center text-white shadow-black text-shadow-gold"

      >
        AI Language Tutor
      </motion.h1>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-red-500 mb-4 p-4 bg-red-100 rounded-md shadow-md"
        >
          {error}
        </motion.div>
      )}
      
      {/* Speech-to-Text Error */}
      {speechError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-red-500 mb-4 p-4 bg-red-100 rounded-md shadow-md"
        >
          {speechError}
        </motion.div>
      )}

      {/* Skill Level Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-black p-6 rounded-xl shadow-xl w-full max-w-lg"
      >
        <label htmlFor="skill-level" className="block text-sm font-medium text-neutral-500 mb-2">
          Select Your Skill Level
        </label>
        <Select value={skillLevel} onValueChange={setSkillLevel}>
          <SelectTrigger className="w-full p-4 rounded-lg bg-gray-100 shadow-md">
            <SelectValue placeholder="Select skill level" />
          </SelectTrigger>
          <SelectContent>
            {skillLevels.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Tabs for Conversation, Vocabulary, and Grammar */}
      <Tabs defaultValue="conversation" className="mt-8 w-full max-w-lg">
        <TabsList className="grid w-full grid-cols-3 mb-6 p-1 rounded-full bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-500 shadow-lg">
          <TabsTrigger value="conversation" className="rounded-full text-black hover:bg-black hover:text-black">
            <MessageCircle className="w-4 h-4 mr-2" />
            Conversation
          </TabsTrigger>
          <TabsTrigger value="vocabulary" className="rounded-full text-white hover:bg-white hover:text-black">
            <BookOpen className="w-4 h-4 mr-2" />
            Vocabulary
          </TabsTrigger>
          <TabsTrigger value="grammar" className="rounded-full text-white hover:bg-white hover:text-black">
            <PenTool className="w-4 h-4 mr-2" />
            Grammar
          </TabsTrigger>
        </TabsList>

        {/* Conversation Tab */}
        <TabsContent value="conversation">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Conversation Practice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col space-y-2">
                  {conversation.map((entry, idx) => (
                    <div key={idx} className={`flex ${entry.speaker === 'User' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-lg px-4 py-2 ${entry.speaker === 'User' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
                        {entry.message}
                      </div>
                    </div>
                  ))}
                  <div ref={conversationEndRef} />
                </div>
                <form onSubmit={handleConversationSubmit} className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ask something..."
                    className="flex-1 p-4 bg-black shadow-md rounded-lg"
                  />
                  <Button type="submit" className="bg-gradient-to-r from-blue-500 to-green-500 text-black rounded-lg">
                    <Send className="w-5 h-5" />
                  </Button>
                </form>

                {/* Speech-to-Text Buttons */}
                <div className="flex space-x-4 mt-4">
                  <Button
                    className="bg-green-500 text-black rounded-lg p-3"
                    onClick={handleStartRecording}
                    disabled={isRecording}
                  >
                    <User className="w-5 h-5 mr-2" />
                    Start Recording
                  </Button>
                  <Button
                    className="bg-red-500 text-white rounded-lg p-3"
                    onClick={handleStopRecording}
                    disabled={!isRecording}
                  >
                    <Bot className="w-5 h-5 mr-2" />
                    Stop Recording
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vocabulary Tab */}
        <TabsContent value="vocabulary">
          <Card className="shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-black">
              <CardTitle className="flex items-center text-2xl">
                <BookOpen className="w-6 h-6 mr-2" />
                Vocabulary Building
              </CardTitle>
              <CardDescription className="text-green-100">Expand your vocabulary with words tailored to your skill level.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {wordError ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-red-500 mb-4 p-4 bg-red-100 rounded-md"
                >
                  {wordError}
                </motion.div>
              ) : wordExercises.length > 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4 bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30 p-6 rounded-lg shadow-inner"
                >
                  <div className="text-4xl font-bold text-center text-green-600 dark:text-green-400">{wordExercises[currentWordIndex].word}</div>
                  <div className="text-black"><span className="font-semibold">Definition:</span> {wordExercises[currentWordIndex].definition}</div>
                  <div className="text-black"><span className="font-semibold">Example:</span> {wordExercises[currentWordIndex].exampleSentence}</div>
                  <div className="text-black text-neutral-500 text-center">Word {currentWordIndex + 1} of {wordExercises.length}</div>
                </motion.div>
              ) : (
                <div className="text-center p-4">Loading word exercises...</div>
              )}
              <div className="flex justify-between mt-6">
                <Button onClick={() => setCurrentWordIndex(prev => Math.max(0, prev - 1))} disabled={currentWordIndex === 0 || isLoadingWord} className="px-4 bg-green-500 hover:bg-green-600">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button onClick={handleNextWord} className="px-4 bg-green-500 hover:bg-green-600" disabled={isLoadingWord}>
                  {isLoadingWord ? 'Loading...' : currentWordIndex < wordExercises.length - 1 ? 'Next' : 'New Set'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grammar Tab */}
        <TabsContent value="grammar">
  <Card className="shadow-lg overflow-hidden">
    <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
      <CardTitle className="flex items-center text-2xl">
        <PenTool className="w-6 h-6 mr-2" />
        Grammar Exercises
      </CardTitle>
      <CardDescription className="text-purple-100">Sharpen your grammar skills with interactive exercises.</CardDescription>
    </CardHeader>
    <CardContent className="p-6">
      {error ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-red-500 mb-4 p-4 bg-red-100 rounded-md"
        >
          {error}
        </motion.div>
      ) : currentGrammarExercise ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="text-lg font-semibold text-black bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg shadow-inner">
            {currentGrammarExercise.question}
          </div>
          <div className="space-y-2">
            {currentGrammarExercise.options.map((option, index) => (
              <Button
                key={index}
                onClick={() => setSelectedAnswer(option)}
                variant={selectedAnswer === option ? "default" : "outline"}
                className="w-full justify-start transition-all duration-200 ease-in-out transform hover:scale-105"
              >
                {option}
              </Button>
            ))}
          </div>
          <Button onClick={handleAnswerSubmit} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" disabled={!selectedAnswer}>
            Submit Answer
          </Button>
          {isAnswerCorrect !== null && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`text-center font-semibold p-4 rounded-lg ${isAnswerCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
            >
              {isAnswerCorrect ? 'Correct!' : (
                <>
                  <p>Incorrect. Try again!</p>
                  <p className="mt-2">The correct answer is: <span className="font-bold">{currentGrammarExercise.correctAnswer}</span></p>
                </>
              )}
            </motion.div>
          )}
        </motion.div>
      ) : (
        <div className="text-center p-4">Loading grammar exercise...</div>
      )}
      <div className="flex justify-center mt-6">
        <Button onClick={handleNextExercise} className="px-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
          Next Exercise
        </Button>
      </div>
    </CardContent>
  </Card>
</TabsContent>



      </Tabs>
    </div>
  );
}
