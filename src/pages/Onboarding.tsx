import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Target, Shield, Bell, ArrowRight, Check } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

const steps = [
  {
    id: "welcome",
    title: "Welcome to LanTrack",
    description: "Your modern companion for tracking OJT hours and managing tasks.",
    icon: <Clock className="w-12 h-12 text-indigo-600" />,
  },
  {
    id: "goals",
    title: "Set Your Goals",
    description: "Define your daily and weekly hour targets to stay on track.",
    icon: <Target className="w-12 h-12 text-indigo-600" />,
  },
  {
    id: "offline",
    title: "Works Offline",
    description: "Don't worry about internet connection. Log your time anywhere, anytime.",
    icon: <Shield className="w-12 h-12 text-indigo-600" />,
  },
  {
    id: "notifications",
    title: "Stay Notified",
    description: "Get reminders to clock out and alerts for new tasks assigned to you.",
    icon: <Bell className="w-12 h-12 text-indigo-600" />,
  },
];

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (user && db) {
        try {
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, { onboardingCompleted: true });
          navigate("/");
        } catch (error) {
          console.error("Error completing onboarding:", error);
          navigate("/");
        }
      } else {
        navigate("/");
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="flex justify-center gap-2 mb-12">
          {steps.map((_, index) => (
            <div 
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentStep ? "w-8 bg-indigo-600" : "w-2 bg-zinc-200 dark:bg-zinc-800"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
              {steps[currentStep].icon}
            </div>
            <h1 className="text-3xl font-bold mb-4 tracking-tight">
              {steps[currentStep].title}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-12 leading-relaxed">
              {steps[currentStep].description}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col gap-4">
          <Button 
            onClick={handleNext}
            className="h-16 rounded-2xl text-lg font-bold shadow-xl shadow-indigo-500/20 gap-2"
          >
            {currentStep === steps.length - 1 ? "Get Started" : "Continue"}
            {currentStep === steps.length - 1 ? <Check className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          </Button>
          
          {currentStep < steps.length - 1 && (
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="text-zinc-500"
            >
              Skip
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
