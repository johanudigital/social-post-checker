import React, { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import logo from './assets/logo.jpeg';

const SocialPostCheckerTool = () => {
  const [postContent, setPostContent] = useState('');
  const [platform, setPlatform] = useState('twitter');
  const [aidaScore, setAidaScore] = useState({ attention: 0, interest: 0, desire: 0, action: 0 });
  const [engagementScore, setEngagementScore] = useState(0);
  const [feedback, setFeedback] = useState([]);

  const platformMaxLengths = useMemo(() => ({
    twitter: 280,
    facebook: 63206,
    instagram: 2200,
    linkedin: 3000,
  }), []);

  const analyzePost = useCallback(debounce(() => {
    let feedbackItems = [];
    let attention = 0, interest = 0, desire = 0, action = 0;
    let engagement = 0;

    // Check post length
    const wordCount = postContent.split(/\s+/).filter(Boolean).length;
    const charCount = postContent.length;
    const maxLength = platformMaxLengths[platform];
    
    if (charCount > maxLength) {
      feedbackItems.push({ type: 'error', message: `Post is too long for ${platform}. Maximum length is ${maxLength} characters.` });
    } else if (charCount > maxLength * 0.9) {
      feedbackItems.push({ type: 'warning', message: `Post is close to ${platform}'s character limit.` });
    } else {
      feedbackItems.push({ type: 'success', message: `Post length is good for ${platform}.` });
      engagement += 10;
    }

    // Attention
    if (postContent.match(/^(🚨|💥|🎉|📢|❗️)/)) {
      attention += 25;
      feedbackItems.push({ type: 'success', message: "Great use of attention-grabbing emoji at the start!" });
    }
    if (postContent.match(/^[A-Z\s!?]+/)) {
      attention += 20;
      feedbackItems.push({ type: 'success', message: "Strong opening with capital letters or punctuation." });
    }
    if (postContent.match(/\?|!/) && attention < 45) {
      attention += 15;
      feedbackItems.push({ type: 'success', message: "Good use of question or exclamation marks to grab attention." });
    }

    // Interest
    const interestingWords = ['why', 'how', 'what if', 'imagine', 'discover'];
    interestingWords.forEach(word => {
      if (postContent.toLowerCase().includes(word)) {
        interest += 10;
        feedbackItems.push({ type: 'success', message: `Good use of the interest-piquing word "${word}".` });
      }
    });

    // Desire
    const desireWords = ['exclusive', 'limited', 'special', 'unique', 'new'];
    desireWords.forEach(word => {
      if (postContent.toLowerCase().includes(word)) {
        desire += 10;
        feedbackItems.push({ type: 'success', message: `Great use of the desire-building word "${word}".` });
      }
    });

    // Action
    const actionWords = ['click', 'buy', 'subscribe', 'sign up', 'learn more', 'visit'];
    actionWords.forEach(word => {
      if (postContent.toLowerCase().includes(word)) {
        action += 15;
        feedbackItems.push({ type: 'success', message: `Excellent call-to-action with "${word}".` });
      }
    });

    // Engagement factors
    if (postContent.match(/\[.*?\]/)) {
      engagement += 15;
      feedbackItems.push({ type: 'success', message: "Good use of brackets to highlight important information." });
    }
    if (postContent.includes('#')) {
      engagement += 10;
      feedbackItems.push({ type: 'success', message: "Hashtags can increase engagement and discoverability." });
    }
    if (postContent.includes('@')) {
      engagement += 10;
      feedbackItems.push({ type: 'success', message: "Mentioning others can boost engagement and reach." });
    }
    if (postContent.match(/https?:\/\/\S+/)) {
      engagement += 5;
      feedbackItems.push({ type: 'success', message: "Including a link can drive traffic and engagement." });
    }

    // Cap scores at 100
    attention = Math.min(attention, 100);
    interest = Math.min(interest, 100);
    desire = Math.min(desire, 100);
    action = Math.min(action, 100);
    engagement = Math.min(engagement, 100);

    // Overall AIDA feedback
    if (attention < 30) feedbackItems.push({ type: 'error', message: "Your post needs a stronger attention-grabbing element." });
    if (interest < 30) feedbackItems.push({ type: 'error', message: "Try to make your post more interesting or intriguing." });
    if (desire < 30) feedbackItems.push({ type: 'error', message: "Increase the desirability of your offer or content." });
    if (action < 30) feedbackItems.push({ type: 'error', message: "Include a clearer call-to-action in your post." });

    // Update state
    setAidaScore({ attention, interest, desire, action });
    setEngagementScore(engagement);
    setFeedback(feedbackItems);
  }, 500), [postContent, platform, platformMaxLengths]);

  const getProgressBarColor = useCallback((score) => {
    if (score < 30) return 'red';
    if (score < 70) return 'orange';
    return 'green';
  }, []);

  const FeedbackItem = useMemo(() => ({ item }) => (
    <li className={`feedback-item ${item.type}`}>
      {item.type === 'success' && '✅ '}
      {item.type === 'error' && '❌ '}
      {item.type === 'warning' && '⚠️ '}
      {item.message}
    </li>
  ), []);

  return (
    <div className="container">
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <img src={logo} alt="Logo" style={{ height: '50px', marginRight: '20px' }} />
        <h1>UDigital Social Post Checker</h1>
      </header>
      <div className="input-group">
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="twitter">Twitter</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="linkedin">LinkedIn</option>
        </select>
      </div>
      <div className="input-group">
        <textarea
          value={postContent}
          onChange={(e) => {
            setPostContent(e.target.value);
            analyzePost();
          }}
          placeholder={`Enter your ${platform} post here...`}
        />
      </div>
      <div className="scores">
        <h2>AIDA Scores:</h2>
        {Object.entries(aidaScore).map(([key, value]) => (
          <div key={key} className="score-item">
            <h3>{key.charAt(0).toUpperCase() + key.slice(1)}: {value}/100</h3>
            <div className="progress-bar">
              <div
                className="progress-bar-inner"
                style={{ width: `${value}%`, backgroundColor: getProgressBarColor(value) }}
              ></div>
            </div>
          </div>
        ))}
        <h2>Engagement Score: {engagementScore}/100</h2>
        <div className="progress-bar">
          <div
            className="progress-bar-inner"
            style={{ width: `${engagementScore}%`, backgroundColor: getProgressBarColor(engagementScore) }}
          ></div>
        </div>
      </div>
      <div>
        <h3>Feedback:</h3>
        <ul className="feedback">
          {feedback.map((item, index) => (
            <FeedbackItem key={index} item={item} />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SocialPostCheckerTool;