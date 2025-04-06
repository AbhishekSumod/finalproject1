// components/LanguageTutorComponent.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, BookOpen, PenTool, Send, User, Bot, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import AuthComponent from './AuthComponent'; // Import the AuthComponent
import { Button } from "./ui/button";
import IntroductionComponent from './IntroductionComponent'; // Import the IntroductionComponent

// Define skill levels for the language tutor
const skillLevels = ["Beginner", "Intermediate", "Advanced"];

// Define the structure of a conversation entry
type ConversationEntry = {
  speaker: "User " | "AI"; // Removed extra spaces
  message: string; // Added message property
};

// Define the API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

// Define the structure of a word exercise
interface WordExercise {
  word: string;
  definition: string;
  exampleSentence: string;
}

// Define the structure of a grammar exercise
interface GrammarExercise {
  question: string;
  options: string[];
  correctAnswer: string;
}

// Main component for the Language Tutor
export function LanguageTutorComponent() {
  const [showIntroduction, setShowIntroduction] = useState(true); // State to manage introduction visibility
  const [skillLevel, setSkillLevel] = useState<string>("Beginner");
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [userInput, setuserinput] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); // Track login state
  const [showLoginPrompt, setShowLoginPrompt] = useState<boolean>(false); // Show login prompt
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const [currentWordExercise, setCurrentWordExercise] = useState<WordExercise | null>(null);
  const [currentGrammarExercise, setCurrentGrammarExercise] = useState<GrammarExercise | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [wordError, setWordError] = useState<string | null>(null);
  const [isLoadingWord, setIsLoadingWord] = useState(false);
  const [wordExercises, setWordExercises] = useState<WordExercise[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const [postureFeedback, setPostureFeedback] = useState<string>("");
  const [borderColor, setBorderColor] = useState<string>("border-black"); // Border color state
  const [isLoading, setIsLoading] = useState<boolean>(true); // Loading state

  // Effect to initialize the Speech Recognition API and load the pose detection model
  useEffect(() => {
    const initialize = async () => {
      if ('webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true; 
        recognitionInstance.interimResults = true; 
        recognitionInstance.lang = 'en-US'; 
        setRecognition(recognitionInstance);

        // Handle results from speech recognition
        recognitionInstance.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join('');
          setuserinput(transcript); 
        };

        // Handle errors in speech recognition
        recognitionInstance.onerror = (event: { error: string; }) => {
          setSpeechError('Error occurred in speech recognition: ' + event.error);
        };
      } else {
        setSpeechError('Speech Recognition is not supported in this browser.');
      }

      if (!showIntroduction) {
        await loadModel();
        startWebcam();
      }

      setIsLoading(false); // Set loading to false after initialization
    };

    initialize();

    return () => stopWebcam(); // Cleanup function
  }, [showIntroduction]); // Dependency on showIntroduction

  // Function to start the webcam
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log("Webcam stream started"); // Log when the stream starts
      }
    } catch (error) {
      console.error("Error accessing webcam: ", error);
    }
  };

  // Function to stop the webcam
  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  // Load the pose detection model
  const loadModel = async () => {
    await tf.setBackend("webgl"); // Uses GPU acceleration
    const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);
    detectorRef.current = detector;
    console.log("Pose detection model loaded"); // Log when the model is loaded
    detectPosture();
  };

  // Detect posture
  const detectPosture = async () => {
    if (!videoRef.current || !detectorRef.current) return;

    // Check if the video is playing
    if (videoRef.current.readyState >= 2) {
      try {
        const poses = await detectorRef.current.estimatePoses(videoRef.current);
        if (poses.length > 0) {
          analyzePosture(poses[0]);
        }
      } catch (error) {
        console.error("Error estimating poses: ", error);
      }
    }

    requestAnimationFrame(detectPosture);
  };

  // Analyze posture
  const analyzePosture = (pose: poseDetection.Pose) => {
    const keypoints = pose.keypoints;
    const leftShoulder = keypoints.find((p) => p.name === "left_shoulder");
    const rightShoulder = keypoints.find((p) => p.name === "right_shoulder");
    const leftHip = keypoints.find((p) => p.name === "left_hip");
    const rightHip = keypoints.find((p) => p.name === "right_hip");

    if (leftShoulder && rightShoulder && leftHip && rightHip) {
      const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);
      const hipDiff = Math.abs(leftHip.y - rightHip.y);
      const threshold = 70; // Adjusted threshold for posture detection

      let feedbackMessage = "";
      if (shoulderDiff < threshold && hipDiff < threshold) {
        feedbackMessage = "Good posture! ✅";
        setBorderColor("border-green-500"); // Set border color to green for good posture
      } else {
        feedbackMessage = "Check your posture! ❌";
        setBorderColor("border-black"); // Set border color to black for bad posture
      }

      setPostureFeedback(feedbackMessage);
    }
  };

  // Fetch words based on the selected skill level
  const fetchWords = async () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    setIsLoadingWord(true);
    try {
      const response = await fetch(`${API_URL}/language-tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vocabulary', skillLevel }),
      });
      const data = await response.json();
      if (response.ok) {
        setWordExercises(data); // Set the fetched word exercises
        setCurrentWordIndex(0); // Reset the current word index
        setWordError(null); // Clear any previous errors
      } else {
        setWordError(data.error || 'Failed to fetch words');
        setWordExercises([]); // Clear word exercises on error
      }
    } catch (error) {
      setWordError('Failed to fetch words');
      setWordExercises([]); // Clear word exercises on error
    } finally {
      setIsLoadingWord(false); // Stop loading state
    }
  };

  // Fetch grammar exercises based on the selected skill level
  const fetchExercise = async () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/language-tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'grammar', skillLevel }),
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentGrammarExercise(data); // Set the fetched grammar exercise
        setSelectedAnswer(null); // Reset selected answer
        setIsAnswerCorrect(null); // Reset answer correctness state
        setError(null); // Clear any previous errors
      } else {
        setError(data.error || 'Failed to fetch exercise');
        setCurrentGrammarExercise(null); // Clear current grammar exercise on error
      }
    } catch (error) {
      setError('Failed to fetch exercise');
      setCurrentGrammarExercise(null); // Clear current grammar exercise on error
    }
  };

  // Handle conversation submission
  const handleConversationSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    if (!userInput.trim()) return; // Do not submit if input is empty
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

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
          { speaker: 'User ', message: userInput }, // Removed extra spaces
          { speaker: 'AI', message: data.message },
        ];
        setConversation(newConversation); // Update conversation state
        setuserinput(''); // Clear user input
        updateProgress(); // Update progress
      } else {
        setError(data.error || 'Failed to get AI response');
      }
    } catch (error) {
      setError('Failed to get AI response');
    }
  };

  // Handle moving to the next word exercise
  const handleNextWord = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    if (currentWordIndex < wordExercises.length - 1) {
      setCurrentWordIndex((prevIndex) => prevIndex + 1); // Move to the next word
    } else {
      fetchWords(); // Fetch more words if at the end of the list
    }
    updateProgress(); // Update progress
  };

  // Handle moving to the next grammar exercise
  const handleNextExercise = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    fetchExercise(); // Fetch a new grammar exercise
  };

  // Update progress state
  const updateProgress = () => {
    setProgress((prevProgress) => Math.min(prevProgress + 10, 100)); // Increment progress
  };

  // Scroll to the bottom of the conversation
  const scrollToBottom = () => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle answer submission for grammar exercises
  const handleAnswerSubmit = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    if (currentGrammarExercise && selectedAnswer) {
      const isCorrect = selectedAnswer === currentGrammarExercise.correctAnswer; // Check if the answer is correct
      setIsAnswerCorrect(isCorrect); // Update answer correctness state
      if (isCorrect) {
        updateProgress(); // Update progress if the answer is correct
      }
    }
  };

  // Start speech recognition
  const handleStartRecording = () => {
    if (recognition) {
      recognition.start(); // Start recognition
      setIsRecording(true); // Set recording state
    }
  };

  // Stop speech recognition
  const handleStopRecording = () => {
    if (recognition) {
      recognition.stop(); // Stop recognition
      setIsRecording(false); // Reset recording state
    }
  };

  // Handle login prompt
  const handleLoginPromptClose = () => {
    setShowLoginPrompt(false);
  };

  // Function to handle starting the tutor
  const handleStart = () => {
    setShowIntroduction(false); // Hide the introduction page
  };

  // Render the introduction or the main content based on the state
  return (
    <div className="w-full h-screen bg-gradient-to-r from-black via-blue-950 to-black flex flex-col shadow-2xl border border-gray-800 rounded-lg backdrop-blur-md bg-opacity-80 overflow-hidden"> {/* Added overflow-hidden */}
      {isLoading ? ( // Show loading animation while loading
        <div className="flex items-center justify-center h-full">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="loader"
          >
            <div className="w-16 h-16 border-4 border-t-4 border-blue-500 rounded-full animate-spin"></div>
          </motion.div>
        </div>
      ) : showIntroduction ? (
        <IntroductionComponent onStart={handleStart} /> // Show introduction component
      ) : (
        <>
          {/* App Bar */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white shadow-md p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">AI Language Tutor</h1>
            <nav className="flex space-x-7">
              <AuthComponent setIsLoggedIn={setIsLoggedIn} /> {/* Pass setIsLoggedIn to AuthComponent */}
              <span className="text-white hover:text-gray-300 cursor-pointer transition duration-300">About</span>
              <span className="text-white hover:text-gray-300 cursor-pointer transition duration-300">Contact</span>
            </nav>
          </div>

          <div className="flex-grow flex flex-col items-center justify-start p-6 pt-20 overflow-y-auto"> {/* Added overflow-y-auto */}
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-5xl font-extrabold text-center text-white drop-shadow-lg mb-6"
            >
              AI Language Tutor
            </motion.h1>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-4 px-6 py-3 text-lg font-semibold text-red-700 bg-red-200 border border-red-400 rounded-lg shadow-md"
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

            {/* Fixed Webcam Video */}
            <div className={`fixed top-24 left-6 border-4 rounded-lg ${borderColor} p-1`}>
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-64 h-64" // Decreased size of the video box
              />
            </div>

            {/* Posture Feedback */}
            <div className="mt-2 text-md font-semibold text-white">{postureFeedback}</div> {/* Reduced text size */}

            {/* Skill Level Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-lg mt-6"
            >
              <label htmlFor="skill-level" className="block text-sm font-medium text-neutral-500 mb-2">
                Select Your Skill Level
              </label>
              <Select value={skillLevel} onValueChange={setSkillLevel}>
                <SelectTrigger className="w-full p-4 rounded-lg bg-gray-700 shadow-md">
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
                <Card className="mb-6 bg-gray-800 border border-gray-700">
                  <CardHeader>
                    <CardTitle>Conversation Practice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-4 h-64 overflow-y-auto"> {/* Set height and enable scrolling */}
                      <div className="flex flex-col space-y-2">
                        {conversation.map((entry, idx) => (
                          <div key={idx} className={`flex ${entry.speaker === 'User ' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`rounded-lg px-4 py-2 ${entry.speaker === 'User ' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
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
                          onChange={(e) => setuserinput(e.target.value)}
                          placeholder="Ask something..."
                          className="flex-1 p-4 bg-gray-700 text-white shadow-md rounded-lg"
                        />
                        <Button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg hover:from-blue-500 hover:to-blue-700 transition duration-300 shadow-lg">
                          <Send className="w-5 h-5" />
                        </Button>
                      </form>

                      {/* Speech-to-Text Buttons */}
                      <div className="flex space-x-4 mt-4">
                        <Button
                          className="bg-gray-600 text-white rounded-lg p-3 hover:bg-gray-700 transition duration-300"
                          onClick={handleStartRecording}
                          disabled={isRecording}
                        >
                          <User  className="w-5 h-5 mr-2" />
                          Start Recording
                        </Button>
                        <Button
                          className="bg-red-600 text-white rounded-lg p-3 hover:bg-red-700 transition duration-300"
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
                <Card className="shadow-lg overflow-hidden bg-gray-800 border border-gray-700">
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
                      <Button onClick={() => setCurrentWordIndex(prev => Math.max(0, prev - 1))} disabled={currentWordIndex === 0 || isLoadingWord} className="px-4 bg-gray-600 hover:bg-gray-700 text-white transition duration-300">
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>
                      <Button onClick={handleNextWord} className="px-4 bg-gray-600 hover:bg-gray-700 text-white transition duration-300" disabled={isLoadingWord}>
                        {isLoadingWord ? 'Loading...' : currentWordIndex < wordExercises.length - 1 ? 'Next' : 'New Set'}
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Grammar Tab */}
              <TabsContent value="grammar">
                <Card className="shadow-lg overflow-hidden bg-gray-800 border border-gray-700">
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
                              className="w-full justify-start transition-all duration-200 ease-in-out transform hover:scale-105 bg-gray-600 text-white hover:bg-gray-700"
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

            {/* Login Prompt Modal */}
            {showLoginPrompt && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <h2 className="text-lg font-semibold">Please log in to continue.</h2>
                  <div className="mt-4">
                    <Button onClick={handleLoginPromptClose} className="bg-blue-500 text-black">
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}