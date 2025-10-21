import { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const appUrl = import.meta.env.VITE_SERVICE_URL;

  const handleFileUpload = async () => {
    console.log(file)
    if (!file) return alert('Please select a file first.');

    const formData = new FormData();
    formData.append('file', file);
    console.log(formData.get('file')); // Should show the File object

    try {
      await fetch(`${appUrl || 'http://localhost:3000/'}/upload`, {
        method: 'POST',
        body: formData,
      });
      alert('File uploaded and parsed!');
    } catch (err) {
      console.log(err)
      alert('Upload failed');
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer('');
    try {
      const res = await fetch(`${appUrl || 'http://localhost:3000'}/ask?q=${encodeURIComponent(question)}`,
     {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer your_token',
        'Content-Type': 'application/json',
      },
      mode: 'cors', // Explicitly set mode to 'cors'
      credentials: 'include', // If sending cookies or authorization headers
    });
      const data = await res.json();
      setAnswer(data.answer);
    } catch (err) {
      console.log(err)
      setAnswer('Error fetching answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App" style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h2>Excel Bot</h2>

      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <button onClick={handleFileUpload} style={{ marginLeft: '10px' }}>
        Upload Excel
      </button>

      <div style={{ marginTop: '2rem' }}>
        <input
          type="text"
          placeholder="Ask a question"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          style={{ width: '600px',height:'40px', marginRight: '10px',marginLeft: '100px' }}
        />
        {file && <button onClick={handleAsk}>Ask</button> }
        
      </div>

      {loading && <p>⏳ Thinking...</p>}
      {answer && (
        <div style={{ marginTop: '1rem',  padding: '1rem' }}>
          <strong>Answer:</strong>
          <p className='text-black'>{answer}</p>
        </div>
      )}
    </div>
  );
}

export default App;
