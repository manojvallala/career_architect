import React from 'react';

const KeywordHeatmap = ({ jobDescription, resumeText }) => {
  if (!jobDescription || !resumeText) return null;

  // 1. Simple function to clean text (remove punctuation, lowercase)
  const clean = (text) => text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");

  // 2. Turn resume into a Set of words for fast lookup
  const resumeWords = new Set(clean(resumeText).split(/\s+/));

  // 3. Split Job Description into words to analyze one by one
  const jobWords = jobDescription.split(/\s+/);

  return (
    <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        🔍 Keyword Match Heatmap
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-bold mr-2">Matched</span>
        <span className="bg-red-100 text-red-800 px-2 py-1 rounded font-bold">Missing</span>
        (Visual check of Job Description keywords found in your resume)
      </p>

      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 leading-relaxed text-gray-700">
        {jobWords.map((word, index) => {
          const cleanWord = clean(word);
          // Common "stop words" we don't care about highlighting
          const stopWords = ["and", "the", "to", "of", "in", "a", "for", "with", "on", "as", "is", "are", "at"];
          
          let colorClass = "text-gray-700"; // Default (neutral)
          
          if (!stopWords.includes(cleanWord) && cleanWord.length > 2) {
            if (resumeWords.has(cleanWord)) {
              colorClass = "bg-green-100 text-green-700 font-semibold px-1 rounded"; // Found
            } else {
              colorClass = "bg-red-50 text-red-600 font-medium px-0.5 rounded"; // Missing
            }
          }

          return (
            <span key={index} className={`${colorClass} mr-1 inline-block`}>
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default KeywordHeatmap;