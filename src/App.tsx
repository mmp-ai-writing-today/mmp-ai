import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { Clock, CheckCircle, AlertCircle, Play, FileText, Check, Loader2 } from 'lucide-react';

const TOTAL_TIME = 60 * 60;

export default function App() {
  const [screen, setScreen] = useState<'intro' | 'test'>('intro');
  const [activeTask, setActiveTask] = useState<'task1' | 'task2'>('task1');
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [task1Text, setTask1Text] = useState('');
  const [task2Text, setTask2Text] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (screen === 'test' && !isSubmitted && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsSubmitted(true);
            setShowModal(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [screen, isSubmitted, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const countWords = (text: string) => {
    const words = text.trim().split(/\s+/);
    return text.trim() === '' ? 0 : words.filter(w => w.length > 0).length;
  };

  const t1Count = countWords(task1Text);
  const t2Count = countWords(task2Text);

  const startTest = (task: 'task1' | 'task2') => {
    setActiveTask(task);
    setScreen('test');
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    setShowModal(true);
  };

  const generateFeedback = async () => {
    setIsGeneratingFeedback(true);
    setFeedback(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
You are an expert IELTS examiner. Please evaluate the following IELTS Academic Writing tasks.

Task 1 Question:
The chart below shows the number of men and women in further education in Britain in three periods and whether they were studying full-time or part-time. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.

Task 1 Answer:
${task1Text || "(No answer provided)"}

Task 2 Question:
In many countries today, people in cities either live alone or in small family units, rather than in large, extended family groups. Is this a positive or negative trend?

Task 2 Answer:
${task2Text || "(No answer provided)"}

Please provide detailed feedback for both tasks based on the official IELTS marking criteria:
1. Task Achievement / Response
2. Coherence and Cohesion
3. Lexical Resource
4. Grammatical Range and Accuracy

Give an estimated band score for each task and an overall estimated writing band score. Format your response in Markdown.
`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setFeedback(response.text || "No feedback generated.");
    } catch (error) {
      console.error("Error generating feedback:", error);
      setFeedback("An error occurred while generating feedback. Please try again.");
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  // Render Intro
  if (screen === 'intro') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans text-gray-800">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 md:p-12 text-center border border-gray-100">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">IELTS Writing Practice Test</h1>
          <p className="text-gray-600 mb-8 text-lg">Academic Module • 60 Minutes • Task 1 & Task 2</p>
          
          <div className="bg-blue-50 text-blue-800 p-6 rounded-xl text-left mb-8 text-sm md:text-base leading-relaxed border border-blue-100">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Test Instructions
            </h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>You have <strong>60 minutes</strong> in total to complete both tasks.</li>
              <li>You should spend about 20 minutes on Task 1 and 40 minutes on Task 2.</li>
              <li>You can navigate between Task 1 and Task 2 at any time during the test.</li>
              <li>The timer will start immediately after you choose which task to begin with.</li>
            </ul>
          </div>

          <h3 className="text-gray-700 font-semibold mb-4 text-lg">Which task would you like to start with?</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => startTest('task1')} className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-blue-600 text-blue-700 px-6 py-4 rounded-xl hover:bg-blue-50 transition-colors font-bold text-lg shadow-sm">
              Start with Task 1
            </button>
            <button onClick={() => startTest('task2')} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 border-2 border-blue-600 text-white px-6 py-4 rounded-xl hover:bg-blue-700 transition-colors font-bold text-lg shadow-sm">
              Start with Task 2
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Test
  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 p-2 sm:p-4 md:p-6 flex flex-col">
      <header className="bg-white rounded-t-xl shadow-sm border-b border-gray-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
        <div className="hidden lg:block w-1/4">
          <h1 className="text-xl font-bold text-slate-800">IELTS Practice</h1>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-full md:w-auto justify-center">
          <button 
            onClick={() => setActiveTask('task1')} 
            className={`px-6 py-2 rounded-md font-semibold transition-all w-1/2 md:w-32 ${activeTask === 'task1' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Task 1
          </button>
          <button 
            onClick={() => setActiveTask('task2')} 
            className={`px-6 py-2 rounded-md font-semibold transition-all w-1/2 md:w-32 ${activeTask === 'task2' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-600 hover:text-slate-800'}`}
          >
            Task 2
          </button>
        </div>
        
        <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-1/4">
          <div className={`flex items-center gap-2 text-xl sm:text-2xl font-mono font-bold px-4 py-2 rounded-lg border ${timeLeft < 300 ? 'text-red-600 bg-red-50 border-red-200' : 'text-slate-800 bg-slate-50 border-slate-200'}`}>
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      <main className="bg-white shadow-sm rounded-b-xl overflow-hidden flex flex-col lg:flex-row flex-grow lg:h-[800px] relative">
        {/* TASK 1 */}
        <div className={`w-full flex flex-col lg:flex-row absolute inset-0 bg-white transition-opacity duration-200 ${activeTask === 'task1' ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}>
          <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-gray-200 p-6 overflow-y-auto bg-slate-50 h-1/2 lg:h-full">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-800 mb-2 border-b-2 border-slate-300 pb-2 inline-block">Task 1 Question</h2>
              <p className="text-md text-slate-700 mt-4 leading-relaxed font-medium bg-yellow-50 p-4 border-l-4 border-yellow-400 rounded-r-md">
                You should spend about 20 minutes on this task.
                <br/><br/>
                The chart below shows the number of men and women in further education in Britain in three periods and whether they were studying full-time or part-time.
                <br/><br/>
                Summarise the information by selecting and reporting the main features, and make comparisons where relevant.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-center font-bold text-sm mb-4">Number of people in further education in Britain (thousands)</h3>
              <div className="relative w-full aspect-video">
                <svg viewBox="0 0 600 400" className="w-full h-full">
                  <g><text x="40" y="355" textAnchor="end" className="text-xs fill-gray-500">0</text><line x1="50" y1="350" x2="550" y2="350" stroke="#e5e7eb" strokeWidth="1" /></g>
                  <g><text x="40" y="305" textAnchor="end" className="text-xs fill-gray-500">200</text><line x1="50" y1="300" x2="550" y2="300" stroke="#e5e7eb" strokeWidth="1" /></g>
                  <g><text x="40" y="255" textAnchor="end" className="text-xs fill-gray-500">400</text><line x1="50" y1="250" x2="550" y2="250" stroke="#e5e7eb" strokeWidth="1" /></g>
                  <g><text x="40" y="205" textAnchor="end" className="text-xs fill-gray-500">600</text><line x1="50" y1="200" x2="550" y2="200" stroke="#e5e7eb" strokeWidth="1" /></g>
                  <g><text x="40" y="155" textAnchor="end" className="text-xs fill-gray-500">800</text><line x1="50" y1="150" x2="550" y2="150" stroke="#e5e7eb" strokeWidth="1" /></g>
                  <g><text x="40" y="105" textAnchor="end" className="text-xs fill-gray-500">1000</text><line x1="50" y1="100" x2="550" y2="100" stroke="#e5e7eb" strokeWidth="1" /></g>
                  <g><text x="40" y="55" textAnchor="end" className="text-xs fill-gray-500">1200</text><line x1="50" y1="50" x2="550" y2="50" stroke="#e5e7eb" strokeWidth="1" /></g>
                  <line x1="50" y1="350" x2="550" y2="350" stroke="#9ca3af" strokeWidth="2" />
                  <g transform="translate(100, 0)">
                    <text x="40" y="370" textAnchor="middle" className="text-sm font-semibold fill-gray-700">1970/71</text>
                    <rect x="0" y="325" width="15" height="25" fill="#1e40af" />
                    <rect x="20" y="100" width="15" height="250" fill="#60a5fa" />
                    <rect x="45" y="330" width="15" height="20" fill="#be185d" />
                    <rect x="65" y="175" width="15" height="175" fill="#f472b6" />
                  </g>
                  <g transform="translate(250, 0)">
                    <text x="40" y="370" textAnchor="middle" className="text-sm font-semibold fill-gray-700">1980/81</text>
                    <rect x="0" y="312.5" width="15" height="37.5" fill="#1e40af" />
                    <rect x="20" y="150" width="15" height="200" fill="#60a5fa" />
                    <rect x="45" y="320" width="15" height="30" fill="#be185d" />
                    <rect x="65" y="150" width="15" height="200" fill="#f472b6" />
                  </g>
                  <g transform="translate(400, 0)">
                    <text x="40" y="370" textAnchor="middle" className="text-sm font-semibold fill-gray-700">1990/91</text>
                    <rect x="0" y="287.5" width="15" height="62.5" fill="#1e40af" />
                    <rect x="20" y="137.5" width="15" height="212.5" fill="#60a5fa" />
                    <rect x="45" y="275" width="15" height="75" fill="#be185d" />
                    <rect x="65" y="87.5" width="15" height="262.5" fill="#f472b6" />
                  </g>
                </svg>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs sm:text-sm">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#1e40af]"></div> Men Full-time</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#60a5fa]"></div> Men Part-time</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#be185d]"></div> Women Full-time</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#f472b6]"></div> Women Part-time</div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex flex-col p-0 h-1/2 lg:h-full">
            <div className="p-4 bg-slate-100 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
              <h2 className="text-lg font-bold text-slate-800">Your Answer (Task 1)</h2>
              <div className="flex items-center gap-4">
                <div className={`hidden sm:flex items-center gap-1.5 text-sm font-medium ${t1Count >= 150 ? 'text-green-600' : 'text-red-600'}`}>
                  {t1Count >= 150 ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{t1Count >= 150 ? 'Sufficient' : 'Min 150 words'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Words:</span>
                  <span className={`text-lg font-bold px-3 py-1 rounded-full ${t1Count >= 150 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {t1Count}
                  </span>
                </div>
              </div>
            </div>
            <textarea 
              value={task1Text}
              onChange={(e) => setTask1Text(e.target.value)}
              disabled={isSubmitted}
              className="flex-grow w-full p-4 sm:p-6 text-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 leading-relaxed text-slate-800 disabled:bg-gray-50" 
              placeholder="Write your Task 1 answer here..." 
              spellCheck="false"
            />
            
            <div className="p-4 bg-slate-100 border-t border-gray-200 flex justify-end items-center">
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitted}
                className={`flex items-center gap-2 text-sm px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors ${isSubmitted ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {isSubmitted ? <Check className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isSubmitted ? 'Submitted' : 'Submit Test'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* TASK 2 */}
        <div className={`w-full flex flex-col lg:flex-row absolute inset-0 bg-white transition-opacity duration-200 ${activeTask === 'task2' ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}>
          <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-gray-200 p-6 overflow-y-auto bg-slate-50 h-1/2 lg:h-full">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-800 mb-2 border-b-2 border-slate-300 pb-2 inline-block">Task 2 Question</h2>
              <p className="text-md text-slate-700 mt-4 leading-relaxed font-medium bg-yellow-50 p-4 border-l-4 border-yellow-400 rounded-r-md">
                You should spend about 40 minutes on this task.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-gray-600 mb-4 text-sm uppercase tracking-wider font-semibold">Write about the following topic:</p>
              
              <blockquote className="text-lg lg:text-xl text-slate-800 font-serif italic border-l-4 border-blue-500 pl-4 py-2 mb-6 bg-blue-50">
                In many countries today, people in cities either live alone or in small family units, rather than in large, extended family groups.
                <br/><br/>
                Is this a positive or negative trend?
              </blockquote>
              
              <p className="text-gray-700 leading-relaxed mb-4">
                Give reasons for your answer and include any relevant examples from your own knowledge or experience.
              </p>
              <p className="text-gray-700 font-bold">
                Write at least 250 words.
              </p>
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex flex-col p-0 h-1/2 lg:h-full">
            <div className="p-4 bg-slate-100 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
              <h2 className="text-lg font-bold text-slate-800">Your Answer (Task 2)</h2>
              <div className="flex items-center gap-4">
                <div className={`hidden sm:flex items-center gap-1.5 text-sm font-medium ${t2Count >= 250 ? 'text-green-600' : 'text-red-600'}`}>
                  {t2Count >= 250 ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{t2Count >= 250 ? 'Sufficient' : 'Min 250 words'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Words:</span>
                  <span className={`text-lg font-bold px-3 py-1 rounded-full ${t2Count >= 250 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {t2Count}
                  </span>
                </div>
              </div>
            </div>
            <textarea 
              value={task2Text}
              onChange={(e) => setTask2Text(e.target.value)}
              disabled={isSubmitted}
              className="flex-grow w-full p-4 sm:p-6 text-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 leading-relaxed text-slate-800 disabled:bg-gray-50" 
              placeholder="Write your Task 2 essay here..." 
              spellCheck="false"
            />
            
            <div className="p-4 bg-slate-100 border-t border-gray-200 flex justify-end items-center">
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitted}
                className={`flex items-center gap-2 text-sm px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors ${isSubmitted ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {isSubmitted ? <Check className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isSubmitted ? 'Submitted' : 'Submit Test'}</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* SUBMIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 my-8">
            {!feedback ? (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Test Submitted!</h3>
                <p className="text-sm text-gray-500 mb-6">Your full IELTS writing practice is complete. Performance summary:</p>
                
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mb-6 text-left space-y-4 max-w-md mx-auto">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-slate-600 font-medium">Total Time Taken:</span>
                    <span className="font-bold text-slate-800 font-mono text-lg">{formatTime(TOTAL_TIME - timeLeft)}</span>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-slate-700 text-sm mb-2">Task 1 (Target: 150 words)</h4>
                    <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-100">
                      <span className="text-slate-600 text-sm">Words written: <strong className="text-slate-800">{t1Count}</strong></span>
                      <span className={`font-bold text-xs px-2 py-1 rounded ${t1Count >= 150 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {t1Count >= 150 ? 'Pass' : 'Under length'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-700 text-sm mb-2">Task 2 (Target: 250 words)</h4>
                    <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-100">
                      <span className="text-slate-600 text-sm">Words written: <strong className="text-slate-800">{t2Count}</strong></span>
                      <span className={`font-bold text-xs px-2 py-1 rounded ${t2Count >= 250 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {t2Count >= 250 ? 'Pass' : 'Under length'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <button 
                    onClick={() => setShowModal(false)} 
                    className="inline-flex justify-center items-center rounded-lg border border-gray-300 px-4 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    Review Answers
                  </button>
                  <button 
                    onClick={generateFeedback}
                    disabled={isGeneratingFeedback}
                    className="inline-flex justify-center items-center gap-2 rounded-lg border border-transparent px-6 py-2.5 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 transition-colors shadow-sm disabled:bg-purple-400"
                  >
                    {isGeneratingFeedback ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating AI Feedback...
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5" />
                        Get AI Feedback
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-left">
                <div className="flex items-center justify-between mb-6 border-b pb-4">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-purple-600" />
                    AI Examiner Feedback
                  </h3>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Close
                  </button>
                </div>
                
                <div className="prose prose-slate max-w-none mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200 max-h-[60vh] overflow-y-auto">
                  <div className="markdown-body">
                    <Markdown>{feedback}</Markdown>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setShowModal(false)} 
                    className="inline-flex justify-center items-center rounded-lg border border-gray-300 px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Back to Test
                  </button>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="inline-flex justify-center items-center rounded-lg border border-transparent px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  >
                    Start New Test
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
