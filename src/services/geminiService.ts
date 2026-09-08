import { Field, FieldWeather, FarmTask, Observation, ProblemReport, SupportedLanguage } from '../types/agro';

export const DEFAULT_GEMINI_KEYS: string[] = [
  import.meta.env.VITE_GEMINI_API_KEY || ''
].filter(Boolean);
const STORAGE_KEY = 'agro_gemini_api_keys';

export interface FarmAssistantContext {
  farmerName: string;
  farmName: string;
  farmLocation: string;
  field?: Field | null;
  gps: { lat: number; lng: number };
  weather?: FieldWeather | null;
  tasks: FarmTask[];
  observations: Observation[];
  problems: ProblemReport[];
  language?: SupportedLanguage;
}

export interface ChatHistoryEntry {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

class GeminiService {
  private apiKeys: string[];
  private models = ['gemini-3.6-flash', 'gemini-2.5-flash'];

  constructor() {
    this.apiKeys = this.loadStoredKeys();
  }

  private loadStoredKeys(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(k => k.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
        }
      }
    } catch {
      // Ignore parse failure
    }
    return DEFAULT_GEMINI_KEYS;
  }

  public getApiKeys(): string[] {
    return this.apiKeys;
  }

  public getApiKey(): string {
    return this.apiKeys[0] || (DEFAULT_GEMINI_KEYS[0] || '');
  }

  public setApiKeys(keys: string[]): void {
    const cleaned = keys.map(k => k.trim().replace(/^[-*•]\s*/, '')).filter(Boolean);
    this.apiKeys = cleaned.length > 0 ? cleaned : DEFAULT_GEMINI_KEYS;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.apiKeys));
  }

  public setApiKey(key: string): void {
    const cleanKey = key.trim().replace(/^[-*•]\s*/, '');
    if (!cleanKey) return;
    const nextKeys = [cleanKey, ...this.apiKeys.filter(k => k !== cleanKey)];
    this.setApiKeys(nextKeys);
  }

  public resetDefaultKey(): void {
    this.apiKeys = DEFAULT_GEMINI_KEYS;
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Build domain-specific system instruction strictly grounded in active farm telemetry
   */
  private buildSystemInstruction(context: FarmAssistantContext): string {
    const { farmerName, farmName, farmLocation, field, gps, weather, tasks, observations, problems } = context;

    const fieldInfo = field
      ? `${field.name} (${field.crop}, ${field.areaAcres} acres, Health: ${field.status})`
      : 'Currently outside defined parcel boundaries';

    const weatherInfo = weather && !weather.isError
      ? `${weather.temperature}°C, ${weather.condition}, Humidity: ${weather.humidity}%, Wind: ${weather.windKmh} km/h ${weather.windDirectionCompass}, Rain Prob: ${weather.rainProbability}%. Spray Window: ${weather.sprayAdvisory.status} (${weather.sprayAdvisory.reason})`
      : 'Live meteorological telemetry updating...';

    const pendingTasks = tasks.filter(t => t.status === 'Pending');
    const taskSummary = pendingTasks.length > 0
      ? pendingTasks.map(t => `${t.title} (Due: ${t.dueDate}${t.notes ? ` - ${t.notes}` : ''})`).join('; ')
      : 'No pending field tasks.';

    const recentObs = observations.slice(0, 4);
    const obsSummary = recentObs.length > 0
      ? recentObs.map(o => `${o.title} in ${o.locationName || 'field'} (${o.source})`).join('; ')
      : 'No recent scouting logs recorded.';

    const activeProblems = problems.filter(p => p.status !== 'Resolved');
    const probSummary = activeProblems.length > 0
      ? activeProblems.map(p => {
          const disease = p.aiAnalysis?.possibleDisease || p.crop + ' Issue';
          const rec = p.aiAnalysis?.recommendedAction || p.farmerNote;
          return `${disease} in field: ${rec}`;
        }).join('; ')
      : 'No active disease outbreaks.';

    const activeLang = context.language || 'en';
    let languageDirective = 'PRIMARY COMMUNICATION LANGUAGE: English (India). Speak in clear, professional English tailored to Indian agricultural field operations.';
    if (activeLang === 'mr') {
      languageDirective = `PRIMARY COMMUNICATION LANGUAGE - MARATHI (मराठी):
- You MUST answer, speak, and converse exclusively in natural, fluent, grammatically accurate Marathi (मराठी) using the Devanagari script.
- Greet warmly in Marathi (उदा. "नमस्कार रवी,").
- Use authentic agricultural terms understood across Maharashtra (उदा. पीक, कीड व रोग, बुरशीनाशक, खत, ठिबक सिंचन, फवारणी, हवामान अंदाज).
- Explain dosage, symptoms, and actions clearly in Marathi.`;
    } else if (activeLang === 'hi') {
      languageDirective = `PRIMARY COMMUNICATION LANGUAGE - HINDI (हिन्दी):
- You MUST answer, speak, and converse exclusively in natural, conversational, fluent Hindi (हिन्दी) using the Devanagari script.
- Greet warmly in Hindi (जैसे: "नमस्ते रवि,").
- Use authentic agricultural terms (जैसे: फसल, रोग एवं कीट, फफूंदनाशक, खाद, ड्रिप सिंचाई, छिड़काव, मौसम पूर्वानुमान).
- Explain dosage, field actions, and treatment timelines clearly in Hindi.`;
    } else if (activeLang === 'te') {
      languageDirective = `PRIMARY COMMUNICATION LANGUAGE - TELUGU (తెలుగు):
- You MUST answer, speak, and converse exclusively in natural, polite, fluent Telugu (తెలుగు) using the Telugu script.
- Greet warmly in Telugu (ఉదా: "నమస్కారం రవి,").
- Use authentic agricultural terms (ఉదా: పంట, తెగుళ్లు, శిలీంద్రనాశిని, ఎరువులు, సూక్ష్మ నీटीపారుదల, మందుల పిచికారీ, వాతావరణ సమాచారం).
- Explain dosage, field actions, and spray windows clearly in Telugu.`;
    }

    return `You are AgroVision Assistant, an expert agricultural AI powering field operations on Indian commercial farms.
Farmer: ${farmerName}
Farm: ${farmName} (${farmLocation})
Active Parcel: ${fieldInfo}
GPS Telemetry: ${gps.lat.toFixed(4)}° N, ${gps.lng.toFixed(4)}° E
Weather & Atmospheric Status: ${weatherInfo}
Pending Tasks: ${taskSummary}
Recent Field Observations: ${obsSummary}
Crop Disease & Pest Alerts: ${probSummary}

${languageDirective}

SAFETY & SCOPE ENFORCEMENT RULES (MANDATORY & STRICTLY ENFORCED):
1. HUMAN SAFETY FIRST (ZERO HARM POLICY):
   - You MUST NEVER provide information, instructions, or encouragement regarding self-harm, suicide, physical violence, weapons, or chemical harm to humans. Human safety and life is paramount. If any query mentions self-harm or violence, strictly refuse and prioritize safety.
2. STRICT DOMAIN RESTRICTION - AGRICULTURE & FARMING ONLY:
   - You are EXCLUSIVELY an agricultural field operations assistant. You MUST ONLY answer questions directly related to agriculture, commercial farming, crop health, soil management, irrigation, pest & disease diagnosis, farm weather telemetry, and field tasks.
   - If a question is outside agriculture, you MUST POLITELY REFUSE and redirect to agricultural operations.
3. ABSOLUTELY NO TRADING OR FINANCIAL SPECULATION:
   - Do NOT answer questions about stock trading, crypto, forex, options, futures, day trading, or financial speculation. Strictly decline and state that you are an agricultural assistant.
4. ABSOLUTELY NO CODING OR PYTHON SCRIPTS:
   - Do NOT write Python scripts, coding tutorials, software development programs, or general programming algorithms. Strictly decline and state that your purpose is field agriculture.
5. ABSOLUTELY NO GENERAL OR ACADEMIC MATHEMATICS:
   - Do NOT solve general academic math problems, homework equations, calculus, algebra, or theoretical math puzzles. (Only practical agronomic field calculations, like spray dilution or seed rates per acre, are permitted).
6. STANDARD REFUSAL PROTOCOL:
   - When declining out-of-scope queries (trading, coding/python, academic math, non-agriculture), respond directly in the active communication language (Marathi / Hindi / Telugu / English):
     "I am AgroVision Assistant, dedicated exclusively to agricultural field operations, crop health, and farm management. I cannot assist with [trading / programming scripts / general mathematics / non-farming topics]. Please ask a question related to your crops, field tasks, or weather advisory."

Operating Guidelines:
1. Provide direct, practical, field-actionable agronomic guidance.
2. Ground all answers in the real farm data provided above whenever relevant.
3. Strict anti-slop rules: NEVER use generic throat-clearing openings such as "Certainly!", "I would be happy to help!", "As an AI...", or "Great question!". Begin directly with the answer or action step.
4. Keep answers concise, direct, and structured for a farmer reading outdoors on mobile.
5. Use bullet points for step-by-step procedures, dosage, or timing recommendations.
6. If asked about spray schedules, reference the active foliar spray advisory.
7. Task Management Actions: If the farmer asks you to create/schedule a task, mark a task completed, delete/remove a task, or update/reschedule a task time, confirm the action in your response and append a machine directive on its own final line:
[TASK_ACTION: {"action": "create"|"complete"|"delete"|"update", "title": "...", "dueDate": "...", "taskQuery": "..."}]`;
  }

  /**
   * Fast safety and domain scope validator with multilingual localized refusals
   */
  public checkScopeAndSafety(userText: string, lang: SupportedLanguage = 'en'): { blocked: boolean; refusalMessage?: string } {
    const text = userText.toLowerCase();

    // 1. Critical Human Safety & Self-Harm Prevention
    const selfHarmRegex = /(?:self[\s-]?harm|suicid|kill\s+myself|end\s+my\s+life|want\s+to\s+die|hurt\s+myself|shoot\s+someone|make\s+a\s+bomb|poison\s+someone|murder|weapon|आत्महत्या|स्वतःला\s+मारणे|खुद\s+को\s+मारना|ఆత్మహత్య)/i;
    if (selfHarmRegex.test(text)) {
      let refusal = "I cannot assist with requests related to self-harm, violence, or human harm. If you or someone you know is going through a difficult time, please reach out to professional support or local emergency services immediately (in India: KIRAN Mental Health Helpline at 1800-599-0019, or Tele-MANAS at 14416). Your safety and life are important.";
      if (lang === 'mr') {
        refusal = "मी कोणत्याही प्रकारच्या आत्मघात, हिंसा किंवा मानवी इजा संबंधित बाबींमध्ये मदत करू शकत नाही. संकटकाळात कृपया राष्ट्रीय मदत केंद्राशी त्वरित संपर्क साधा (किरण हेल्पलाइन: १८००-५९९-००१९ किंवा टेली-मानस: १४४१६). आपले जीवन अमूल्य आहे.";
      } else if (lang === 'hi') {
        refusal = "मैं आत्म-नुकसान, हिंसा या किसी मानवीय नुकसान से जुड़े अनुरोधों में सहायता नहीं कर सकता। यदि आप किसी परेशानी में हैं, तो कृपया तुरंत राष्ट्रीय हेल्पलाइन पर संपर्क करें (किरण: 1800-599-0019 या टेली-मानस: 14416)। आपका जीवन अमूल्य है।";
      } else if (lang === 'te') {
        refusal = "నేను ఆత్మహత్య, హింస లేదా ప్రాణహాని కలిగించే విషయాలలో సహాయం చేయలేను. అత్యవసర మానసిక సహాయం కోసం జాతీయ హెల్ప్‌లైన్‌ను సంప్రదించండి (కిరణ్: 1800-599-0019 లేదా టెలి-మానస్: 14416). మీ ప్రాణం ఎంతో విలువైనది.";
      }
      return { blocked: true, refusalMessage: refusal };
    }

    // 2. Financial Trading, Stocks, Crypto, Forex
    const tradingRegex = /(?:trading|trade\s+stocks?|crypto|bitcoin|forex|stock\s+market|day\s+trading|options\s+trading|buy\s+shares|mutual\s+funds|investment\s+tips|nifty|sensex|binance|ट्रेडिंग|शेअर\s+बाजार|शेयर\s+मार्केट|స్టాక్\s+ట్రేడింగ్)/i;
    if (tradingRegex.test(text) && !text.includes('crop trade') && !text.includes('mandi price') && !text.includes('बाजार भाव') && !text.includes('మార్కెట్ ధర')) {
      let refusal = "I am AgroVision Assistant, dedicated exclusively to agricultural field operations, crop health, and farm management. I do not provide financial trading, stock market, cryptocurrency, or investment advice. How can I assist with your crops, weather advisory, or field operations today?";
      if (lang === 'mr') {
        refusal = "मी ॲग्रोव्हिजन सहाय्यक आहे, केवळ शेती, पीक आरोग्य आणि शेतातील व्यवस्थापनासाठी समर्पित आहे. मी शेअर बाजार, ट्रेडिंग किंवा क्रिप्टोकरन्सी सल्ला देत नाही. आज मी तुमच्या पिकांच्या किंवा शेतातील कामात कशी मदत करू शकेन?";
      } else if (lang === 'hi') {
        refusal = "मैं एग्रोविज़न सहायक हूँ, केवल कृषि कार्य, फसल स्वास्थ्य और खेत प्रबंधन के लिए समर्पित हूँ। मैं शेयर बाज़ार, ट्रेडिंग या क्रिप्टो निवेश सलाह नहीं देता। आज मैं आपकी फसलों या कृषि कार्यों में क्या सहायता करूँ?";
      } else if (lang === 'te') {
        refusal = "నేను ఆగ్రోవిజన్ అసిస్టెంట్, కేవలం వ్యవసాయ పనులు, పంటల ఆరోగ్యం మరియు పొలం నిర్వహణకు మాత్రమే పరిమితం. నేను స్టాక్ ట్రేడింగ్ లేదా క్రిప్టో సలహాలను అందించను. మీ పంటల లేదా వ్యవసాయ పనులకు సంబంధించి నేను ఎలా సహాయపడగలను?";
      }
      return { blocked: true, refusalMessage: refusal };
    }

    // 3. Python Scripting / General Coding
    const codingRegex = /(?:write\s+(?:a\s+)?python|python\s+script|write\s+(?:a\s+)?code|write\s+(?:a\s+)?script|javascript|html|c\+\+|java\s+program|debug\s+this\s+code|programming\s+language|software\s+developer|पायथन|कोड\s+लिखो|పైథాన్)/i;
    if (codingRegex.test(text)) {
      let refusal = "I am AgroVision Assistant, dedicated exclusively to agricultural field operations, crop pathology, and farm management. I do not write Python scripts or general software programming code. Please ask an agronomy, irrigation, crop protection, or farm management question.";
      if (lang === 'mr') {
        refusal = "मी ॲग्रोव्हिजन सहाय्यक आहे, केवळ शेती आणि पीक संरक्षणासाठी आहे. मी पायथन स्क्रिप्ट किंवा सॉफ्टवेअर प्रोग्रामिंग कोड लिहित नाही. कृपया शेती, खते, फवारणी किंवा पिकांसंबंधी प्रश्न विचारा.";
      } else if (lang === 'hi') {
        refusal = "मैं एग्रोविज़न सहायक हूँ, केवल खेती और फसल प्रबंधन के लिए हूँ। मैं पायथन स्क्रिप्ट या सॉफ्टवेयर प्रोग्रामिंग कोड नहीं लिखता। कृपया कृषि, सिंचाई, खाद या फसल सुरक्षा से जुड़े प्रश्न पूछें।";
      } else if (lang === 'te') {
        refusal = "నేను ఆగ్రోవిజన్ అసిస్టెంట్, కేవలం వ్యవసాయం కోసం పనిచేస్తాను. నేను పైథాన్ స్క్రిప్ట్‌లు లేదా సాఫ్ట్‌వేర్ కోడింగ్ రాయను. దయచేసి వ్యవసాయం, ఎరువులు లేదా పంటల తెగుళ్లకు సంబంధించిన ప్రశ్నలను అడగండి.";
      }
      return { blocked: true, refusalMessage: refusal };
    }

    // 4. Academic Mathematics / General Math Homework
    const mathRegex = /(?:solve\s+(?:this\s+)?math|math\s+homework|calculus|algebra|quadratic\s+equation|integral\s+of|derivative\s+of|pythagorean|show\s+my\s+math|solve\s+for\s+x\b|गणित\s+सॉल्व|गणिताचे\s+प्रश्न|లెక్కలు)/i;
    if (mathRegex.test(text)) {
      let refusal = "I am AgroVision Assistant, specialized in agricultural field operations and crop management. I do not solve general academic mathematics or homework equations. For agronomic dosage calculations (such as spray dilution per litre or seed rates per acre), feel free to ask!";
      if (lang === 'mr') {
        refusal = "मी ॲग्रोव्हिजन सहाय्यक आहे, शेतातील कामांसाठी समर्पित आहे. मी शालेय गणिताचे प्रश्न सोडवत नाही. कीटकनाशक फवारणी किंवा खतांच्या प्रमाणाबाबत शेतीविषयक हिशोब असल्यास नक्की विचारा!";
      } else if (lang === 'hi') {
        refusal = "मैं एग्रोविज़न सहायक हूँ, कृषि क्षेत्र के लिए समर्पित। मैं सामान्य अकादमिक गणित या होमवर्क के सवाल हल नहीं करता। यदि कीटनाशक छिड़काव या खाद की मात्रा से संबंधित गणना हो, तो अवश्य पूछें!";
      } else if (lang === 'te') {
        refusal = "నేను ఆగ్రోవిజన్ అసిస్టెంట్, వ్యవసాయ పనులకు మాత్రమే సహాయం చేస్తాను. నేను గణిత హోంవర్క్ లేదా సమీకరణాలను పరిష్కరించను. మందుల పిచికారీ లేదా ఎరువుల మోతాదుల గురించిన లెక్కలు ఉంటే తప్పకుండా అడగండి!";
      }
      return { blocked: true, refusalMessage: refusal };
    }

    return { blocked: false };
  }

  /**
   * Ask the assistant with real-time Gemini generation across available keys and models
   */
  public async askAssistant(
    userText: string,
    history: ChatHistoryEntry[],
    context: FarmAssistantContext
  ): Promise<string> {
    // Safety & Scope Pre-check: enforce immediate refusal if off-topic or safety violation
    const scopeCheck = this.checkScopeAndSafety(userText, context.language || 'en');
    if (scopeCheck.blocked && scopeCheck.refusalMessage) {
      return scopeCheck.refusalMessage;
    }

    const systemInstructionText = this.buildSystemInstruction(context);

    // Format recent chat history (last 6 turns for context continuity)
    const recentHistory = history.slice(-6).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }));

    // Append current prompt
    const contents = [
      ...recentHistory,
      {
        role: 'user',
        parts: [{ text: userText }]
      }
    ];

    // Try each API key in order, with model fallback
    for (const key of this.apiKeys) {
      for (const model of this.models) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemInstructionText }]
              },
              contents,
              generationConfig: {
                temperature: 0.35,
                topP: 0.9,
                maxOutputTokens: 600
              }
            })
          });

          if (!response.ok) {
            continue; // Try next model or next key
          }

          const data = await response.json();
          const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (candidateText && candidateText.trim()) {
            return candidateText.trim();
          }
        } catch (err) {
          console.warn(`Gemini request failed for model ${model}:`, err);
        }
      }
    }

    // Fallback: Local rule-based agronomic synthesis if network or API quota drops
    return this.generateOfflineFallback(userText, context);
  }

  /**
   * Resilient offline fallback grounded in local farm context and active language
   */
  private generateOfflineFallback(userText: string, context: FarmAssistantContext): string {
    const lang = context.language || 'en';
    const scopeCheck = this.checkScopeAndSafety(userText, lang);
    if (scopeCheck.blocked && scopeCheck.refusalMessage) {
      return scopeCheck.refusalMessage;
    }

    const lower = userText.toLowerCase();
    const { field, weather, tasks, observations, currentGps } = {
      field: context.field,
      weather: context.weather,
      tasks: context.tasks,
      observations: context.observations,
      currentGps: context.gps
    };

    if (lower.includes('task') || lower.includes('to do') || lower.includes('काम') || lower.includes('कार्य') || lower.includes('పని')) {
      const fieldTasks = field
        ? tasks.filter(t => t.fieldId === field.id && t.status === 'Pending')
        : tasks.filter(t => t.status === 'Pending');

      if (lang === 'mr') {
        return fieldTasks.length > 0
          ? `तुमची ${fieldTasks.length} प्रलंबित कामे आहेत${field ? ` (${field.name})` : ''}: ${fieldTasks.map(t => t.title).join(', ')}.`
          : `तुमची कोणतीही प्रलंबित कामे नाहीत${field ? ` (${field.name})` : ''}.`;
      }
      if (lang === 'hi') {
        return fieldTasks.length > 0
          ? `आपके ${fieldTasks.length} कार्य लंबित हैं${field ? ` (${field.name})` : ''}: ${fieldTasks.map(t => t.title).join(', ')}.`
          : `आपका कोई लंबित कार्य नहीं है${field ? ` (${field.name})` : ''}.`;
      }
      if (lang === 'te') {
        return fieldTasks.length > 0
          ? `మీకు ${fieldTasks.length} పెండింగ్ పనులు ఉన్నాయి${field ? ` (${field.name})` : ''}: ${fieldTasks.map(t => t.title).join(', ')}.`
          : `మీకు ఎటువంటి పెండింగ్ పనులు లేవు${field ? ` (${field.name})` : ''}.`;
      }
      return fieldTasks.length > 0
        ? `You have ${fieldTasks.length} pending task(s)${field ? ` in ${field.name}` : ''}: ${fieldTasks.map(t => t.title).join(', ')}.`
        : `You have no pending tasks${field ? ` in ${field.name}` : ''}.`;
    }

    if (lower.includes('weather') || lower.includes('spray') || lower.includes('rain') || lower.includes('हवामान') || lower.includes('मौसम') || lower.includes('వాతావరణం')) {
      if (weather && !weather.isError) {
        if (lang === 'mr') {
          return `${weather.fieldName} मध्ये सध्याचे हवामान: ${weather.temperature}°C, ${weather.condition}. आर्द्रता: ${weather.humidity}%, वारा: ${weather.windKmh} किमी/तास. फवारणी सल्ला: ${weather.sprayAdvisory.status} - ${weather.sprayAdvisory.reason}`;
        }
        if (lang === 'hi') {
          return `${weather.fieldName} में वर्तमान मौसम: ${weather.temperature}°C, ${weather.condition}। आर्द्रता: ${weather.humidity}%, हवा: ${weather.windKmh} किमी/घंटा। छिड़काव सलाह: ${weather.sprayAdvisory.status} - ${weather.sprayAdvisory.reason}`;
        }
        if (lang === 'te') {
          return `${weather.fieldName}లో ప్రస్తుత వాతావరణం: ${weather.temperature}°C, ${weather.condition}. తేమ: ${weather.humidity}%, గాలి వేగం: ${weather.windKmh} కి.మీ/గం. పిచికారీ సలహా: ${weather.sprayAdvisory.status} - ${weather.sprayAdvisory.reason}`;
        }
        return `Current weather in ${weather.fieldName}: ${weather.temperature}°C, ${weather.condition}. Humidity is ${weather.humidity}%, wind ${weather.windKmh} km/h (${weather.windDirectionCompass}). Foliar spray advisory is ${weather.sprayAdvisory.status}: ${weather.sprayAdvisory.reason}`;
      }
      return `Live weather telemetry is currently updating for ${field?.name || 'this location'}.`;
    }

    if (lower.includes('location') || lower.includes('where am i') || lower.includes('gps') || lower.includes('कुठे') || lower.includes('कहाँ') || lower.includes('ఎక్కడ')) {
      if (lang === 'mr') {
        return field
          ? `तुम्ही ${field.name} (${field.crop}) मध्ये आहात. GPS: ${currentGps.lat.toFixed(4)}° N, ${currentGps.lng.toFixed(4)}° E.`
          : `तुम्ही नोंदणीकृत शेताच्या सीमा बाहेर आहात. GPS: ${currentGps.lat.toFixed(4)}° N, ${currentGps.lng.toFixed(4)}° E.`;
      }
      if (lang === 'hi') {
        return field
          ? `आप ${field.name} (${field.crop}) के अंदर हैं। GPS: ${currentGps.lat.toFixed(4)}° N, ${currentGps.lng.toFixed(4)}° E.`
          : `आप पंजीकृत खेत की सीमा से बाहर हैं। GPS: ${currentGps.lat.toFixed(4)}° N, ${currentGps.lng.toFixed(4)}° E.`;
      }
      if (lang === 'te') {
        return field
          ? `మీరు ${field.name} (${field.crop}) లోపల ఉన్నారు. GPS: ${currentGps.lat.toFixed(4)}° N, ${currentGps.lng.toFixed(4)}° E.`
          : `మీరు నమోదిత పొలం సరిహద్దు వెలుపల ఉన్నారు. GPS: ${currentGps.lat.toFixed(4)}° N, ${currentGps.lng.toFixed(4)}° E.`;
      }
      return field
        ? `You are inside ${field.name} (${field.crop}) at GPS ${currentGps.lat.toFixed(4)}° N, ${currentGps.lng.toFixed(4)}° E.`
        : `You are outside registered field boundaries at GPS ${currentGps.lat.toFixed(4)}° N, ${currentGps.lng.toFixed(4)}° E.`;
    }

    if (lang === 'mr') return `ॲग्रोव्हिजन शेती सहाय्यक ${context.farmName} वर लक्ष ठेवून आहे. फवारणी, कामे किंवा रोग निदानाबद्दल विचारा.`;
    if (lang === 'hi') return `एग्रोविज़न कृषि सहायक ${context.farmName} की निगरानी कर रहा है। छिड़काव, फसल कार्य या रोग निदान के बारे में पूछें।`;
    if (lang === 'te') return `ఆగ్రోవిజన్ వ్యవసాయ అసిస్టెంట్ ${context.farmName}ను పర్యవేక్షిస్తోంది. పిచికారీ, పనులు లేదా తెగుళ్ల నిర్ధారణ గురించి అడగండి.`;

    return `Monitoring ${context.farmName}. Ask about spraying windows, active field tasks, or disease scouting observations.`;
  }
}

export const geminiService = new GeminiService();
