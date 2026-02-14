import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPoll, votePoll } from '../services/api';
import { getSocket } from '../services/socket';

function Poll() {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);

  // Anti-abuse Mechanism #1: localStorage check
  const STORAGE_KEY = `voted_poll_${id}`;

  const loadPoll = useCallback(async () => {
    try {
      const data = await getPoll(id);
      setPoll(data);
      
      // If backend says user has voted, mark as voted
      if (data.hasVoted) {
        setHasVoted(true);
        localStorage.setItem(STORAGE_KEY, 'true');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load poll');
    } finally {
      setLoading(false);
    }
  }, [id, STORAGE_KEY]);

  useEffect(() => {
    // Check localStorage for previous vote
    const votedBefore = localStorage.getItem(STORAGE_KEY);
    if (votedBefore) {
      setHasVoted(true);
    }

    loadPoll();

    // Socket.io setup for real-time updates
    const socket = getSocket();
    
    socket.emit('joinPoll', id);

    socket.on('pollUpdate', (updatedPoll) => {
      if (updatedPoll.id === id) {
        setPoll(updatedPoll);
      }
    });

    return () => {
      socket.emit('leavePoll', id);
      socket.off('pollUpdate');
    };
  }, [id, STORAGE_KEY, loadPoll]);

  const handleVote = async () => {
    if (selectedOption === null || hasVoted || voting) return;

    // Check localStorage again before voting
    if (localStorage.getItem(STORAGE_KEY)) {
      setError('You have already voted on this poll');
      setHasVoted(true);
      return;
    }

    setVoting(true);
    setError('');

    try {
      const result = await votePoll(id, selectedOption);
      setPoll(result.poll);
      setHasVoted(true);
      
      // Anti-abuse Mechanism #1: Mark as voted in localStorage
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to submit vote';
      setError(errorMsg);
      
      // If server says already voted, mark locally
      if (err.response?.data?.hasVoted) {
        setHasVoted(true);
        localStorage.setItem(STORAGE_KEY, 'true');
      }
    } finally {
      setVoting(false);
    }
  };

  const calculatePercentage = (votes, totalVotes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const getTotalVotes = () => {
    if (!poll) return 0;
    return poll.options.reduce((sum, option) => sum + option.votes, 0);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading poll...</div>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="container">
        <div className="error-message">{error}</div>
        <Link to="/create" className="back-link">← Create a new poll</Link>
      </div>
    );
  }

  const totalVotes = getTotalVotes();

  return (
    <div className="container">
      <Link to="/create" className="back-link">← Create a new poll</Link>
      
      <h2>
        {poll.question}
        {hasVoted && <span className="voted-badge">✓ Voted</span>}
      </h2>

      {error && <div className="error-message">{error}</div>}

      {!hasVoted ? (
        <>
          <div className="poll-options">
            {poll.options.map((option, index) => (
              <div 
                key={index} 
                className={`poll-option ${selectedOption === index ? 'selected' : ''}`}
                onClick={() => setSelectedOption(index)}
              >
                <label>
                  <input
                    type="radio"
                    name="poll-option"
                    value={index}
                    checked={selectedOption === index}
                    onChange={() => setSelectedOption(index)}
                  />
                  {option.text}
                </label>
              </div>
            ))}
          </div>

          <button 
            onClick={handleVote} 
            className="btn-primary"
            disabled={selectedOption === null || voting}
          >
            {voting ? 'Submitting...' : 'Submit Vote'}
          </button>
        </>
      ) : (
        <>
          <div className="results-container">
            <h3 style={{ marginBottom: 20, color: '#333' }}>
              Results ({totalVotes} {totalVotes === 1 ? 'vote' : 'votes'})
            </h3>
            {poll.options.map((option, index) => {
              const percentage = calculatePercentage(option.votes, totalVotes);
              return (
                <div key={index} className="result-item">
                  <div className="result-label">
                    <span>{option.text}</span>
                    <span className="vote-count">{option.votes} votes</span>
                  </div>
                  <div className="result-bar">
                    <div 
                      className="result-bar-fill" 
                      style={{ width: `${percentage}%` }}
                    >
                      {percentage > 0 && `${percentage}%`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="realtime-indicator">
            <span className="realtime-dot"></span>
            <span>Live results - updates automatically</span>
          </div>
        </>
      )}
    </div>
  );
}

export default Poll;
