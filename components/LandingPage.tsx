// components/LandingPage.tsx
"use client";
import { useRouter } from "next/navigation"; 
import { Button } from "@/components/ui/button"; 
import { motion } from "framer-motion";

export function LandingPage() {
  const router = useRouter();

  const handleFreeClick = () => {
    router.push("/language-tutor?mode=Free"); 
  };

  const handlePaidClick = () => {
    router.push("/language-tutor?mode=Paid"); 
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-red-500 via-blue-600 to-red-500">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-5xl font-extrabold mb-8 text-center text-white"
      >
        Welcome to AI Language Tutor
      </motion.h1>
      <div className="space-x-4">
        <Button onClick={handleFreeClick} className="bg-green-500 text-white">
          Free
        </Button>
        <Button onClick={handlePaidClick} className="bg-blue-500 text-white">
          Paid
        </Button>
      </div>
    </div>
  );
}