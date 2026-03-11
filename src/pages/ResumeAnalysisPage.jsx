import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { analyzeMatch } from '../utils/skillsDictionary';
import { Zap, Target, AlertCircle, UploadCloud, FileText, Trash2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// Configure PDF.js worker using relative unpkg standard URL (best for Vite compatibility without backend setup)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function ResumeAnalysisPage() {
  const { user } = useAuth();
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [jdText, setJdText] = useState('');
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [parsingPDF, setParsingPDF] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Only accept PDFs
    if (file.type !== 'application/pdf') {
      alert("Please upload a PDF document.");
      return;
    }

    setFileName(file.name);
    setParsingPDF(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + ' \n';
      }
      
      setResumeText(fullText);
    } catch (err) {
      console.error('Error parsing PDF:', err);
      alert("Failed to read the PDF document. Please try a different file.");
      setFileName('');
      setResumeText('');
    } finally {
      setParsingPDF(false);
    }
  };

  const removeFile = () => {
    setFileName('');
    setResumeText('');
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jdText.trim()) return;
    setAnalyzing(true);
    try {
      const analysis = analyzeMatch(resumeText, jdText);
      setResult(analysis);
      // Save to DB
      await api.saveAnalysis({
        user_id: user.id,
        resume_text: resumeText,
        jd_text: jdText,
        matched_skills: analysis.matchedSkills,
        missing_skills: analysis.missingSkills,
        score: analysis.score,
      });
    } catch (e) {
      console.error('Analysis error:', e);
    } finally {
      setAnalyzing(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await api.getAnalyses(user.id);
      setHistory(data);
      setShowHistory(true);
    } catch (e) { console.error(e); }
  };

  const scoreColor = (score) => {
    if (score >= 70) return 'var(--accent-green)';
    if (score >= 40) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  return (
    <div className="fade-in page-enter">
      <div className="page-header" style={{ position: 'relative', zIndex: 1 }}>
        <div>
          <h1 className="page-title bounce-in" style={{ display: 'inline-block' }}>Resume Analysis 🤖</h1>
          <p className="page-subtitle">Check how well your resume matches the job description ✨</p>
        </div>
        <button className="btn btn-secondary" onClick={loadHistory}>
          View History ({history.length || '...'})
        </button>
      </div>

      {/* Input Section */}
      <div className="analysis-grid" style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>📄 Resume Document</h3>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {!fileName ? (
              <div 
                className="pdf-dropzone" 
                onClick={() => fileInputRef.current?.click()}
                style={{ 
                  border: '2px dashed var(--border-color)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: 'var(--sp-8)', 
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-glass)',
                  transition: 'var(--transition)'
                }}
              >
                <input 
                  type="file" 
                  accept=".pdf,application/pdf" 
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }} 
                  ref={fileInputRef}
                />
                
                {parsingPDF ? (
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-2)' }}>
                     <div className="spinner" style={{ width: 24, height: 24, border: '3px solid var(--accent-purple-light)', borderTopColor: 'var(--bg-glass)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                     <p style={{ color: 'var(--text-secondary)' }}>Extracting text from PDF...</p>
                   </div>
                ) : (
                   <div className="bounce-in">
                     <UploadCloud size={48} style={{ color: 'var(--accent-purple)', margin: '0 auto var(--sp-4)' }} />
                     <h4 style={{ fontSize: 'var(--fs-base)', color: 'var(--text-heading)', marginBottom: 'var(--sp-1)' }}>Upload Resume</h4>
                     <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)' }}>Click to browse or drag & drop</p>
                     <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 'var(--sp-2)' }}>Supports PDF documents only</p>
                   </div>
                )}
              </div>
            ) : (
              <div 
                className="pdf-selected slide-up" 
                style={{ 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-lg)', 
                  padding: 'var(--sp-6)', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(139, 92, 246, 0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
                  <div style={{ padding: 'var(--sp-3)', background: 'rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--accent-purple-light)' }}>
                    <FileText size={28} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{fileName}</h4>
                    <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent-green)', marginTop: 'var(--sp-1)' }}>Successfully extracted!</p>
                  </div>
                </div>
                <button className="btn btn-ghost" onClick={removeFile} title="Remove file">
                   <Trash2 size={18} style={{ color: 'var(--accent-red)' }} />
                </button>
              </div>
            )}
            
            {resumeText && (
              <div style={{ marginTop: 'auto', paddingTop: 'var(--sp-4)' }}>
                <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)'}}>
                  Extracted {resumeText ? analyzeMatch(resumeText, '').resumeSkills.length : 0} recognizable skills from your PDF.
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="card">
          <h3 className="chart-title">📋 Job Description</h3>
          <textarea
            id="jd-text"
            className="form-textarea"
            placeholder="Paste the job description here..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            rows={12}
            style={{ minHeight: 250 }}
          />
          <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 'var(--sp-2)' }}>
            Skills required: {jdText ? analyzeMatch('', jdText).jdSkills.length : 0}
          </p>
        </div>
      </div>

      <div className="text-center">
        <button
          className="btn btn-primary"
          onClick={handleAnalyze}
          disabled={analyzing || !resumeText.trim() || !jdText.trim()}
          style={{ width: '100%' }}
        >
          {analyzing ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <div className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              Analyzing Magic... ✨
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }} className="bounce-in">
              <Zap size={18} />
              Analyze Match 🔥
            </span>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="slide-up">
          {/* Score */}
          <div className="card text-center" style={{ marginBottom: 'var(--sp-5)' }}>
            <div className="analysis-score">
              <div className="score-circle" style={{ color: scoreColor(result.score) }}>
                {result.score}%
              </div>
              <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--text-heading)' }}>
                Compatibility Score
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-sm)', marginTop: 'var(--sp-2)' }}>
                {result.score >= 70 ? 'Great match! Your resume aligns well with this role. 🎉' :
                 result.score >= 40 ? 'Decent match. Consider adding some missing skills. 🤔' :
                 'Low match. You may want to update your resume for this role. 😔'}
              </p>
            </div>
          </div>

          {/* Matched & Missing Skills */}
          <div className="analysis-grid">
            <div className="card">
              <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <Target size={18} style={{ color: 'var(--accent-green)' }} /> Matched Skills ({result.matchedSkills.length})
              </h3>
              {result.matchedSkills.length > 0 ? (
                <div className="skill-tags">
                  {result.matchedSkills.map(s => <span key={s} className="skill-tag matched">{s}</span>)}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>No matching skills found</p>
              )}
            </div>
            <div className="card">
              <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <AlertCircle size={18} style={{ color: 'var(--accent-red)' }} /> Missing Skills ({result.missingSkills.length})
              </h3>
              {result.missingSkills.length > 0 ? (
                <div className="skill-tags">
                  {result.missingSkills.map(s => <span key={s} className="skill-tag missing">{s}</span>)}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>No missing skills — great match!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {showHistory && history.length > 0 && (
        <div className="card mt-6">
          <h3 className="card-title" style={{ marginBottom: 'var(--sp-4)' }}>Analysis History</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Matched</th>
                  <th>Missing</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{new Date(h.created_at).toLocaleString()}</td>
                    <td><span style={{ fontWeight: 700, color: scoreColor(h.score) }}>{h.score}%</span></td>
                    <td style={{ fontSize: 'var(--fs-xs)' }}>{h.matched_skills.length} skills</td>
                    <td style={{ fontSize: 'var(--fs-xs)' }}>{h.missing_skills.length} skills</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
