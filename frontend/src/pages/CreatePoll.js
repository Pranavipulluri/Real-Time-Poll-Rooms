import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPoll } from '../services/api';

function CreatePoll() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareLink, setShareLink] = useState('');

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    const validOptions = options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      setError('Please enter at least 2 options');
      return;
    }

    setLoading(true);

    try {
      const result = await createPoll(question, validOptions);
      const fullShareLink = `${window.location.origin}/poll/${result.pollId}`;
      setShareLink(fullShareLink);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  };

  const createAnother = () => {
    setQuestion('');
    setOptions(['', '']);
    setShareLink('');
    setError('');
  };

  if (shareLink) {
    return (
      <div className="container">
        <h1>Poll Created! 🎉</h1>
        <p className="subtitle">Share this link with others to collect votes</p>
        
        <div className="share-link-container">
          <p style={{ fontWeight: 600, marginBottom: 10 }}>Your shareable link:</p>
          <div className="share-link">
            <input 
              type="text" 
              value={shareLink} 
              readOnly 
              onClick={(e) => e.target.select()}
            />
            <button onClick={copyLink} className="btn-secondary">
              Copy
            </button>
          </div>
        </div>

        <button 
          onClick={() => navigate(`/poll/${shareLink.split('/').pop()}`)}
          className="btn-primary"
          style={{ marginTop: 20 }}
        >
          View Poll
        </button>

        <button 
          onClick={createAnother}
          className="btn-secondary"
          style={{ marginTop: 10, width: '100%' }}
        >
          Create Another Poll
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Create a Poll</h1>
      <p className="subtitle">Create your poll and share it with the world</p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Question *</label>
          <input
            type="text"
            placeholder="What's your favorite programming language?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Options * (minimum 2)</label>
          <div className="options-list">
            {options.map((option, index) => (
              <div key={index} className="option-input-group">
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  disabled={loading}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="btn-remove"
                    disabled={loading}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="btn-add"
            disabled={loading}
          >
            + Add Option
          </button>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Poll'}
        </button>
      </form>
    </div>
  );
}

export default CreatePoll;
