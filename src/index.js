import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import SocialPostCheckerTool from './social-post-checker';
import './index.css';

ReactDOM.render(
  <Router basename={process.env.PUBLIC_URL}>
    <SocialPostCheckerTool />
  </Router>,
  document.getElementById('root')
);
