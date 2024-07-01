import React, { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';
import logo from './assets/logo.jpeg';
import { franc } from 'franc-min';
import langs from 'langs';
import nlp from 'compromise';

const SocialPostCheckerTool = () => {
  const [postContent, setPostContent] = useState('');
  const [platform, setPlatform] = useState('twitter');
  const [language, setLanguage] = useState('en');
  const [aidaScore, setAidaScore] = useState({ attention: 0, interest: 0, desire: 0, action: 0 });
  const [engagementScore, setEngagementScore] = useState(0);
  const [feedback, setFeedback] = useState([]);

  const platformMaxLengths = useMemo(() => ({
    twitter: 280,
    facebook: 63206,
    instagram: 2200,
    linkedin: 3000,
  }), []);

  const detectLanguage = (text) => {
    const detectedLangCode = franc(text);
    const lang = langs.where("3", detectedLangCode);
    return lang ? (lang.name === 'Dutch' ? 'nl' : 'en') : 'en';
  };

  const analyzePost = useCallback(debounce(() => {
    let feedbackItems = [];
    let attention = 0, interest = 0, desire = 0, action = 0;
    let engagement = 0;

    const detectedLanguage = detectLanguage(postContent);
    setLanguage(detectedLanguage);

    const doc = nlp(postContent);
    const wordCount = doc.wordCount();
    const charCount = postContent.length;
    const maxLength = platformMaxLengths[platform];
    const sentences = doc.sentences().out('array');

    // Check post length
    if (charCount > maxLength) {
      feedbackItems.push({ type: 'error', message: `Post is too long for ${platform}. Maximum length is ${maxLength} characters.` });
    } else if (charCount > maxLength * 0.9) {
      feedbackItems.push({ type: 'warning', message: `Post is close to ${platform}'s character limit.` });
    } else {
      feedbackItems.push({ type: 'success', message: `Post length is good for ${platform}.` });
      engagement += 10;
    }

    // Check sentence structure
    if (sentences.length === 1 && wordCount > 30) {
      feedbackItems.push({ type: 'warning', message: "Consider breaking your content into multiple sentences for better readability." });
    } else if (sentences.length > 1) {
      feedbackItems.push({ type: 'success', message: "Good use of multiple sentences to structure your content." });
      engagement += 5;
    }

    // Analyze sentiment
    const sentiment = doc.sentiment();
    if (sentiment > 0.5) {
      attention += 20;
      feedbackItems.push({ type: 'success', message: "Your post has a positive tone, which can grab attention." });
    } else if (sentiment < -0.5) {
      attention += 15;
      feedbackItems.push({ type: 'info', message: "Your post has a negative tone. This can be attention-grabbing but use cautiously." });
    }

    // Check for questions (Interest)
    const questions = doc.questions().out('array');
    if (questions.length > 0) {
      interest += 20;
      feedbackItems.push({ type: 'success', message: "Good use of questions to generate interest." });
    }

    // Check for imperatives (Action)
    const imperatives = doc.sentences().filter(s => s.has('#Imperative')).out('array');
    if (imperatives.length > 0) {
      action += 25;
      feedbackItems.push({ type: 'success', message: "Strong call-to-action with imperative sentences." });
    }

    // Check for superlatives (Desire)
    const superlatives = doc.superlatives().out('array');
    if (superlatives.length > 0) {
      desire += 20;
      feedbackItems.push({ type: 'success', message: "Good use of superlatives to create desire." });
    }

    // Check for named entities (Interest/Engagement)
    const entities = doc.topics().out('array');
    if (entities.length > 0) {
      interest += 15;
      engagement += 10;
      feedbackItems.push({ type: 'success', message: "Mentioning specific entities can increase interest and engagement." });
    }

    // Check for hashtags and mentions
    const hashtags = postContent.match(/#\w+/g) || [];
    const mentions = postContent.match(/@\w+/g) || [];
    if (hashtags.length > 0) {
      engagement += 10;
      feedbackItems.push({ type: 'success', message: "Hashtags can increase engagement and discoverability." });
    }
    if (mentions.length > 0) {
      engagement += 10;
      feedbackItems.push({ type: 'success', message: "Mentioning others can boost engagement and reach." });
    }

    // Check for URLs
    if (postContent.match(/https?:\/\/\S+/)) {
      engagement += 5;
      feedbackItems.push({ type: 'success', message: "Including a link can drive traffic and engagement." });
    }

    // Analyze readability
    const avgWordLength = doc.terms().out('array').reduce((sum, term) => sum + term.length, 0) / wordCount;
    if (avgWordLength > 6) {
      feedbackItems.push({ type: 'warning', message: "Your post contains many long words. Consider simplifying for better readability." });
    } else {
      engagement += 5;
      feedbackItems.push({ type: 'success', message: "Good use of concise language for readability." });
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
      {item.type === 'info' && 'ℹ️ '}
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
