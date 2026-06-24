/**
 * Brand Strategy Plan generation
 * Creates a comprehensive strategy document from Claude analysis
 */

export interface BrandStrategyPlan {
  clientId: string;
  businessOverview: {
    whatYouDo: string;
    whoYouServe: string;
    uniqueValueProp: string;
  };
  targetAudience: {
    demographics: string;
    painPoints: string[];
    goals: string[];
  };
  contentStrategy: {
    pillars: string[];
    pillarDescriptions: Record<string, string>;
    rationale: string;
  };
  channelStrategy: {
    channels: string[];
    channelRationale: Record<string, string>;
    postingFrequency: string;
    bestTimes: string;
  };
  toneAndVoice: {
    personality: string;
    voiceGuidance: string;
    doList: string[];
    dontList: string[];
    examplePhrases: string[];
  };
  successMetrics: {
    engagementTargets: string;
    timelineExpectations: string;
    keyIndicators: string[];
  };
}

/**
 * Shape of the raw analysis produced by the AI model. All fields are
 * optional because the model output is dynamic and may omit any of them.
 */
export interface BrandAnalysis {
  contentPillars?: string[];
  businessDescription?: string;
  targetAudience?: string;
  uniqueValueProp?: string;
  audiencePainPoints?: string[] | string;
  priorityChannels?: string[];
  postingFrequency?: string;
  bestTimes?: string;
  brandPersonality?: string;
  toneOfVoice?: string;
}

/**
 * Transform Claude analysis into Brand Strategy Plan
 */
export function transformAnalysisToStrategy(analysis: BrandAnalysis): Omit<BrandStrategyPlan, 'clientId'> {
  const pillars = analysis.contentPillars ?? [];

  return {
    businessOverview: {
      whatYouDo: analysis.businessDescription || 'Your business description',
      whoYouServe: analysis.targetAudience || 'Your target audience',
      uniqueValueProp: analysis.uniqueValueProp || 'Your unique value proposition',
    },
    targetAudience: {
      demographics: analysis.targetAudience || 'To be determined',
      painPoints: Array.isArray(analysis.audiencePainPoints)
        ? analysis.audiencePainPoints
        : [analysis.audiencePainPoints || 'To be determined'],
      goals: ['Solve key pain points', 'Achieve business objectives', 'Build community'],
    },
    contentStrategy: {
      pillars: Array.isArray(pillars) ? pillars : [],
      pillarDescriptions: pillars.reduce((acc: Record<string, string>, pillar: string) => {
        acc[pillar] = `Content focused on ${pillar}`;
        return acc;
      }, {}),
      rationale: 'These 5 pillars align with your business goals and audience interests',
    },
    channelStrategy: {
      channels: analysis.priorityChannels ?? ['LinkedIn', 'Twitter', 'Instagram'],
      channelRationale: {
        'LinkedIn': 'Professional audience, thought leadership',
        'Twitter': 'Real-time engagement, industry conversations',
        'Instagram': 'Visual storytelling, brand personality',
      },
      postingFrequency: analysis.postingFrequency || '5 posts per week',
      bestTimes: analysis.bestTimes || 'Weekday mornings 9am-12pm EST',
    },
    toneAndVoice: {
      personality: analysis.brandPersonality || 'Professional, friendly, authentic',
      voiceGuidance: analysis.toneOfVoice || 'Speak directly to your audience needs',
      doList: [
        'Be specific with data and examples',
        'Share customer success stories',
        'Ask questions to engage community',
        'Respond to comments within 24 hours',
      ],
      dontList: [
        'Generic corporate speak',
        'Excessive self-promotion',
        'Controversial politics/religion',
        'Unverified claims',
      ],
      examplePhrases: [
        'Here\'s what we learned...',
        'Our customers told us...',
        'The reality is...',
        'Let\'s talk about...',
      ],
    },
    successMetrics: {
      engagementTargets: '10% average engagement rate, 500+ followers in 90 days',
      timelineExpectations: 'Month 1: Build audience. Month 2: Increase engagement. Month 3: Establish authority.',
      keyIndicators: [
        'Comments and replies',
        'Shares and reposts',
        'Click-through rates',
        'Website traffic from social',
        'New email signups',
      ],
    },
  };
}

/**
 * Generate HTML version for email
 */
export function generateStrategyHTML(strategy: Omit<BrandStrategyPlan, 'clientId'>): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a1a1a; border-bottom: 3px solid #6366f1; padding-bottom: 10px; }
    h2 { color: #4f46e5; margin-top: 30px; }
    h3 { color: #666; }
    .section { margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 8px; }
    .list { margin: 10px 0; }
    .list li { margin: 8px 0; }
    .metric { padding: 10px; background: white; border-left: 4px solid #6366f1; margin: 10px 0; }
    .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Your Brand Strategy Plan</h1>
    <p>Based on your brand interview, here's your personalized strategy for social media success.</p>

    <div class="section">
      <h2>Business Overview</h2>
      <h3>What You Do</h3>
      <p>${strategy.businessOverview.whatYouDo}</p>
      <h3>Who You Serve</h3>
      <p>${strategy.businessOverview.whoYouServe}</p>
      <h3>Unique Value Proposition</h3>
      <p>${strategy.businessOverview.uniqueValueProp}</p>
    </div>

    <div class="section">
      <h2>Target Audience</h2>
      <h3>Demographics</h3>
      <p>${strategy.targetAudience.demographics}</p>
      <h3>Pain Points</h3>
      <ul class="list">
        ${strategy.targetAudience.painPoints.map(p => `<li>${p}</li>`).join('')}
      </ul>
    </div>

    <div class="section">
      <h2>Content Strategy: 5 Pillars</h2>
      <p>${strategy.contentStrategy.rationale}</p>
      <ul class="list">
        ${strategy.contentStrategy.pillars.map(p => `<li><strong>${p}</strong></li>`).join('')}
      </ul>
    </div>

    <div class="section">
      <h2>Channel Strategy</h2>
      <p><strong>Channels:</strong> ${strategy.channelStrategy.channels.join(', ')}</p>
      <p><strong>Frequency:</strong> ${strategy.channelStrategy.postingFrequency}</p>
      <p><strong>Best Times:</strong> ${strategy.channelStrategy.bestTimes}</p>
    </div>

    <div class="section">
      <h2>Tone & Voice Guide</h2>
      <p><strong>Brand Personality:</strong> ${strategy.toneAndVoice.personality}</p>
      <h3>Do's</h3>
      <ul class="list">
        ${strategy.toneAndVoice.doList.map(d => `<li>✓ ${d}</li>`).join('')}
      </ul>
      <h3>Don'ts</h3>
      <ul class="list">
        ${strategy.toneAndVoice.dontList.map(d => `<li>✗ ${d}</li>`).join('')}
      </ul>
    </div>

    <div class="section">
      <h2>Success Metrics</h2>
      <p>${strategy.successMetrics.engagementTargets}</p>
      <p>${strategy.successMetrics.timelineExpectations}</p>
    </div>
  </div>
</body>
</html>
  `;
}
