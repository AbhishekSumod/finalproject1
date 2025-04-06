import { useState } from "react";
import { Button } from "./ui/button"; // Keep the Start Learning button
import { motion } from "framer-motion";

const IntroductionComponent = ({ onStart }) => {
  const [selectedSection, setSelectedSection] = useState<"about" | "contact" | null>(null);

  const handleAboutClick = () => {
    setSelectedSection("about");
  };

  const handleContactClick = () => {
    setSelectedSection("contact");
  };

  const handleClose = () => {
    setSelectedSection(null);
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-screen bg-gradient-to-r from-black via-blue-950 to-black text-white px-8 overflow-hidden">
      {/* App Bar */}
      <div className="absolute top-0 left-0 w-full flex justify-between items-center p-4 bg-transparent z-10">
        <h1 className="text-xl font-bold">AI Language Tutor</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleAboutClick}
            className="text-white border border-white rounded-lg px-4 py-2 hover:bg-white hover:text-black transition duration-300"
          >
            About
          </button>
          <button
            onClick={handleContactClick}
            className="text-white border border-white rounded-lg px-4 py-2 hover:bg-white hover:text-black transition duration-300"
          >
            Contact
          </button>
        </div>
      </div>

      {/* Background Shapes */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
      >
        <svg className="absolute w-full h-full" viewBox="0 0 1440 320">
          <path fill="rgba(255, 255, 255, 0.1)" d="M0,128L30,144C60,160,120,192,180,202.7C240,213,300,203,360,186.7C420,171,480,149,540,144C600,139,660,149,720,160C780,171,840,181,900,186.7C960,192,1020,192,1080,186.7C1140,181,1200,171,1260,160C1320,149,1380,139,1410,134.7L1440,128L1440,320L1410,320C1380,320,1320,320,1260,320C1200,320,1140,320,1080,320C1020,320,960,320,900,320C840,320,780,320,720,320C660,320,600,320,540,320C480,320,420,320,360,320C300,320,240,320,180,320C120,320,60,320,30,320H0Z"></path>
        </svg>
      </motion.div>

      {/* Title Section */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-5xl font-extrabold mb-4"
      >
        AI Language <span className="text-blue-400">Tutor</span>
      </motion.h1>

      {/* Subheading Section */}
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-4xl font-bold text-blue-400 mb-4"
      >
        Speak Fluently, Learn Smarter
      </motion.h2>

      {/* Description Section */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-lg text-gray-300 text-center mb-8"
      >
        AI-powered instant feedback on grammar, pronunciation, and fluency.
      </motion.p>

      {/* Start Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Button
          onClick={onStart}
          className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white rounded-lg px-6 py-3 text-lg font-semibold shadow-xl transform hover:scale-110 transition duration-300"
        >
          Start Learning
        </Button>
      </motion.div>

      {/* About and Contact Display */}
      {selectedSection && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-8 rounded-lg shadow-lg text-black max-w-lg mx-auto"
          >
            <h2 className="text-2xl font-bold mb-4">{selectedSection === "about" ? "About " : "Contact"}</h2>
            <p className="text-lg mb-6">
              {selectedSection === "about" ? (
                "This AI Language Tutor is designed to help users improve their language skills through interactive exercises, real-time feedback, and personalized learning experiences."
              ) : (
                <span>
                  For inquiries, please contact: <span className="font-semibold">projectaieng@gmail.com</span>
                </span>
              )}
            </p>
            <Button
              onClick={handleClose}
              className="bg-blue-500 text-black rounded-lg px-6 py-2 hover:bg-blue-600 transition duration-300"
            >
              Close
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default IntroductionComponent;
