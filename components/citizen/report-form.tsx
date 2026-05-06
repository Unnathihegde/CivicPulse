'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LeafletMap } from '@/components/ui/leaflet-map';
import { GoogleGenerativeAI } from "@google/generative-ai";

const CATEGORIES = [
  { value: 'pothole', label: 'Pothole', icon: '🕳️' },
  { value: 'streetlight', label: 'Broken Streetlight', icon: '💡' },
  { value: 'graffiti', label: 'Graffiti', icon: '🎨' },
  { value: 'debris', label: 'Debris', icon: '🗑️' },
  { value: 'other', label: 'Other', icon: '📍' },
];

export default function ReportForm({ onReportSubmitted }: { onReportSubmitted: () => void }) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    category: 'pothole',
    severity: '3',
    summary: '',
    lat: 40.7128, // Default to a central location
    lng: -74.006,
  });
  
  // Track if map has been clicked to show the pin
  const [hasSelectedLocation, setHasSelectedLocation] = useState(false);

  const fileToGenerativePart = async (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        if (!reader.result) {
          reject(new Error("FileReader result is empty"));
          return;
        }
        const base64 = (reader.result as string).split(',')[1];
        if (!base64) {
          reject(new Error("Base64 conversion resulted in undefined"));
          return;
        }
        
        resolve({
          inlineData: {
            mimeType: file.type,
            data: base64
          }
        });
      };
      reader.onerror = reject;
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    setIsAiLoading(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key is not set");

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const imagePart = await fileToGenerativePart(file);

      const prompt = `Analyze this civic issue image.

Return ONLY JSON in this exact format:
{
  "category": "pothole | garbage | streetlight",
  "severity": number (1-5)
}

Do not return anything else.`;

      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text();

      let cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();

      try {
        const parsed = JSON.parse(cleanText);
        
        // Map garbage back to debris since it is our actual category
        let parsedCategory = parsed.category;
        if (parsedCategory === 'garbage') parsedCategory = 'debris';

        setFormData(prev => ({
          ...prev,
          category: CATEGORIES.some(c => c.value === parsedCategory) ? parsedCategory : 'other',
          severity: parsed.severity ? String(Math.min(5, Math.max(1, parseInt(parsed.severity)))) : prev.severity
        }));
      } catch (parseError) {
        console.error("AI response JSON parsing failed:", parseError);
        // Do nothing else; this prevents blocking the user and allows manual selection.
      }
    } catch (error) {
      console.error("AI Error:", error);
      // Fallback: Do NOT block user, just allow manual selection
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.summary.trim()) {
      alert('Please describe the issue');
      return;
    }
    if (!hasSelectedLocation) {
      alert('Please select a location on the map');
      return;
    }

    setIsLoading(true);
    setSuccessMessage('');

    try {
      let imageUrl = null;

      // 1. Upload Image to Supabase
      if (selectedFile) {
        const filePath = `public/${Date.now()}-${selectedFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('reports')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/reports/${uploadData.path}`;
      }

      // 2. Insert Report
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('reports').insert([
        {
          user_id: user?.id || null,
          category: formData.category,
          severity: parseInt(formData.severity),
          summary: formData.summary,
          lat: formData.lat,
          lng: formData.lng,
          image_url: imageUrl,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      setSuccessMessage('Report submitted successfully! Thank you for helping improve our community.');
      setFormData({ category: 'pothole', severity: '3', summary: '', lat: 40.7128, lng: -74.006 });
      setHasSelectedLocation(false);
      setSelectedFile(null);
      setImagePreview(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh parent data
      setTimeout(() => onReportSubmitted(), 500);
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, lat, lng }));
    setHasSelectedLocation(true);
  };

  return (
    <div className="bg-white/80 backdrop-blur-md dark:bg-gray-900/70 rounded-3xl shadow-lg border border-white/20 p-8 space-y-8 transition-all duration-300 hover:shadow-xl">
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Report an Issue</h2>
        <p className="text-sm text-muted-foreground mt-1">Help your community by reporting local issues</p>
      </div>

      {successMessage && (
        <div className="p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
      {/* Image Upload */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-foreground">
          Photo Evidence (Optional, but helps AI)
        </label>
        <div className="border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-2xl p-10 flex flex-col items-center justify-center relative group transition-all duration-300 text-center cursor-pointer min-h-[200px]">
          {imagePreview ? (
            <div className="w-full relative rounded-xl overflow-hidden shadow-inner">
              <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  type="button" 
                  className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:bg-red-600 transition transform hover:scale-105"
                  onClick={(e) => { e.preventDefault(); setSelectedFile(null); setImagePreview(null); }}
                >
                  Remove Photo
                </button>
              </div>
              {isAiLoading && (
                 <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                   <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                   <span className="text-sm font-bold text-primary animate-pulse">✨ AI Analyzing Photo...</span>
                 </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-foreground mb-1">Click or drag photo here</p>
              <p className="text-sm text-muted-foreground mb-4">JPEG, PNG up to 10MB</p>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

        {/* Map Location Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground mb-1">
            Where is the issue? <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-muted-foreground mb-3 hover:opacity-80">
            Click on the map to drop a pin at the exact location.
          </p>
          <div className="ring-1 ring-border rounded-2xl overflow-hidden h-[350px] relative shadow-inner">
            <LeafletMap 
              onLocationSelect={handleLocationSelect}
              clickMarker={hasSelectedLocation ? [formData.lat, formData.lng] : null}
              className="h-full w-full"
            />
          </div>
          {hasSelectedLocation && (
            <p className="text-xs text-primary font-medium text-right mt-1">
              Location selected: {formData.lat.toFixed(4)}, {formData.lng.toFixed(4)}
            </p>
          )}
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3 flex justify-between items-center">
            <span>What type of issue?</span>
            {isAiLoading && <span className="text-xs text-primary font-normal">Detecting...</span>}
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat.value })}
                className={`p-4 rounded-2xl border-2 transition-all duration-300 text-center flex flex-col items-center justify-center hover:scale-[1.05] ${
                  formData.category === cat.value
                    ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20'
                    : 'border-border bg-white dark:bg-gray-800 hover:border-primary/50 hover:shadow-md'
                }`}
              >
                <span className="text-2xl block mb-1">{cat.icon}</span>
                <span className="text-xs font-medium text-foreground">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Severity Slider */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-foreground flex justify-between items-center">
            <span>Severity Level</span>
            {isAiLoading && <span className="text-xs text-primary font-normal">Detecting...</span>}
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="5"
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-medium">Low Priority</span>
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-sm font-bold text-primary">
                {formData.severity}
              </span>
              <span className="text-xs text-muted-foreground font-medium">Critical</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Description
          </label>
          <textarea
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            placeholder="Describe the issue in detail..."
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-border rounded-xl text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all shadow-sm"
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {formData.summary.length}/200 characters
          </p>
        </div>

        <Button 
          disabled={isLoading || isAiLoading} 
          className="w-full rounded-2xl h-14 text-lg font-bold shadow-lg bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 transition-all hover:scale-[1.01]" 
          type="submit"
        >
          {isLoading ? 'Submitting...' : 'Submit Report'}
        </Button>
      </form>
    </div>
  );
}
