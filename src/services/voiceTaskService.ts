import { FarmTask, Field, SupportedLanguage } from '../types/agro';

export interface VoiceTaskResult {
  handled: boolean;
  action?: 'create' | 'complete' | 'delete' | 'update';
  task?: FarmTask;
  title?: string;
  dueDate?: string;
  fieldId?: string | null;
  fieldName?: string;
  targetTaskId?: string;
  speechReply?: string;
  confirmationText?: string;
}

/**
 * Fuzzy matches a task from a spoken query string (English, Marathi, Hindi, Telugu)
 */
function findMatchingTask(query: string, tasks: FarmTask[]): FarmTask | null {
  const cleanQ = query.toLowerCase().trim();

  // 1. Check for index-based references ("task 1", "काम 1", "कार्य 1", "టాస్క్ 1")
  const numMatch =
    cleanQ.match(/(?:task|काम|कार्य|టాస్క్|number|क्र\.|नंबर)?\s*(\d+)/i);
  if (numMatch) {
    const idx = parseInt(numMatch[1], 10) - 1;
    if (idx >= 0 && idx < tasks.length) {
      return tasks[idx];
    }
  }
  if ((cleanQ.includes('first') || cleanQ.includes('पहिला') || cleanQ.includes('पहला') || cleanQ.includes('మొదటి')) && tasks.length > 0) return tasks[0];
  if ((cleanQ.includes('second') || cleanQ.includes('दुसरा') || cleanQ.includes('दूसरा') || cleanQ.includes('రెండవ')) && tasks.length > 1) return tasks[1];
  if ((cleanQ.includes('third') || cleanQ.includes('तिसरा') || cleanQ.includes('तीसरा') || cleanQ.includes('మూడవ')) && tasks.length > 2) return tasks[2];
  if ((cleanQ.includes('last') || cleanQ.includes('शेवटचा') || cleanQ.includes('आखिरी') || cleanQ.includes('చివరి')) && tasks.length > 0) return tasks[tasks.length - 1];

  // 2. Direct string containment
  for (const t of tasks) {
    const tTitle = t.title.toLowerCase();
    if (cleanQ.includes(tTitle) || tTitle.includes(cleanQ)) {
      return t;
    }
  }

  // 3. Keyword matching (e.g. "drip", "irrigation", "mango", "anthracnose", "spray", "prune")
  const words = cleanQ.split(/\s+/).filter(w => w.length > 3 && !['task', 'mark', 'delete', 'complete', 'completed', 'update', 'remove', 'काम', 'पूर्ण', 'हटवा'].includes(w));
  let bestMatch: FarmTask | null = null;
  let maxMatches = 0;

  for (const t of tasks) {
    const tLower = t.title.toLowerCase();
    let matches = 0;
    for (const w of words) {
      if (tLower.includes(w)) matches++;
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = t;
    }
  }

  if (maxMatches >= 1) {
    return bestMatch;
  }

  return null;
}

/**
 * Extract time / due date from spoken string
 */
function extractTimeAndDue(text: string): { dueDate: string; cleanText: string } {
  let dueDate = 'Today';
  let cleanText = text;

  // Patterns like "tomorrow at 4 pm", "tomorrow 10 am", "today at 5:30 pm", "उद्या", "कल", "రేపు"
  const timeRegex = /(?:due|at|for|by|on)?\s*(tomorrow(?:\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?|today(?:\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?)?|\d{1,2}(?::\d{2})?\s*(?:am|pm)|within\s+\d+\s+(?:hours|days)|उद्या|कल|రేపు|आज|ఈరోజు)/i;

  const match = text.match(timeRegex);
  if (match) {
    const rawMatch = match[1].trim();
    if (rawMatch.includes('उद्या') || rawMatch.includes('कल') || rawMatch.includes('రేపు')) {
      dueDate = 'Tomorrow';
    } else if (rawMatch.includes('आज') || rawMatch.includes('ఈరోజు')) {
      dueDate = 'Today';
    } else {
      dueDate = rawMatch.charAt(0).toUpperCase() + rawMatch.slice(1);
    }
    cleanText = text.replace(match[0], '').trim();
  }

  return { dueDate, cleanText };
}

/**
 * Extract target field from text
 */
function extractField(text: string, currentField?: Field | null, allFields: Field[] = []): { fieldId: string | null; fieldName: string } {
  const lower = text.toLowerCase();

  for (const f of allFields) {
    if (lower.includes(f.name.toLowerCase()) || lower.includes(f.crop.toLowerCase())) {
      return { fieldId: f.id, fieldName: f.name };
    }
  }

  if (currentField) {
    return { fieldId: currentField.id, fieldName: currentField.name };
  }

  if (allFields.length > 0) {
    return { fieldId: allFields[0].id, fieldName: allFields[0].name };
  }

  return { fieldId: null, fieldName: 'General Farm' };
}

/**
 * Detect script language if not passed
 */
function detectInputLanguage(text: string, fallback: SupportedLanguage = 'en'): SupportedLanguage {
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  if (/[\u0900-\u097F]/.test(text)) {
    if (/झाले|करा|उद्या|माझे|शेती|फवारणी|हटवा/i.test(text)) return 'mr';
    return 'hi';
  }
  return fallback;
}

/**
 * Core Voice Task Command Parser with Multilingual Support (Marathi, Hindi, Telugu, English)
 */
export function parseVoiceTaskCommand(
  transcript: string,
  existingTasks: FarmTask[],
  currentField?: Field | null,
  allFields: Field[] = [],
  preferredLang: SupportedLanguage = 'en'
): VoiceTaskResult {
  const text = transcript.trim();
  const lower = text.toLowerCase();
  const lang = detectInputLanguage(text, preferredLang);

  // Guard against non-task commands
  const isTaskRelated =
    lower.includes('task') ||
    lower.includes('schedule') ||
    lower.includes('work order') ||
    lower.startsWith('mark ') ||
    lower.startsWith('complete ') ||
    lower.startsWith('delete ') ||
    lower.startsWith('remove ') ||
    lower.startsWith('add ') ||
    lower.startsWith('create ') ||
    lower.startsWith('update ') ||
    // Marathi
    text.includes('काम') ||
    text.includes('पूर्ण') ||
    text.includes('हटवा') ||
    text.includes('नवीन') ||
    // Hindi
    text.includes('कार्य') ||
    text.includes('पूरा') ||
    text.includes('हटाओ') ||
    text.includes('नया') ||
    // Telugu
    text.includes('టాస్క్') ||
    text.includes('పని') ||
    text.includes('పూర్తి') ||
    text.includes('తొలగించు') ||
    text.includes('కొత్త');

  if (!isTaskRelated) {
    return { handled: false };
  }

  // 1. COMPLETE / MARK AS COMPLETED COMMANDS
  const isComplete =
    /(?:mark|set|flag)?\s*(?:task)?\s*(.+?)\s*(?:as\s+)?(?:completed|done|finished)/i.test(text) ||
    /^(?:complete|finish|resolve)\s+(?:task\s+)?(.+)/i.test(text) ||
    /पूर्ण|पूरा|పూర్తి/i.test(text);

  if (isComplete) {
    let queryPart = '';
    const m1 = text.match(/(?:mark|set|flag)?\s*(?:task)?\s*(.+?)\s*(?:as\s+)?(?:completed|done|finished)/i);
    const m2 = text.match(/^(?:complete|finish|resolve)\s+(?:task\s+)?(.+)/i);
    if (m1 && m1[1]) queryPart = m1[1];
    else if (m2 && m2[1]) queryPart = m2[1];
    else queryPart = text;

    queryPart = queryPart.replace(/^(?:the\s+|task\s+|काम\s+|कार्य\s+|టాస్క్\s+)/i, '').trim();
    const matchedTask = queryPart ? findMatchingTask(queryPart, existingTasks) : (existingTasks.find(t => t.status === 'Pending') || existingTasks[0]);

    if (matchedTask) {
      let speech = `Marked task "${matchedTask.title}" as completed.`;
      let confirm = `Successfully marked "${matchedTask.title}" as completed.`;

      if (lang === 'mr') {
        speech = `काम "${matchedTask.title}" पूर्ण झाले म्हणून नोंदवले आहे.`;
        confirm = `काम "${matchedTask.title}" यशस्वीरित्या पूर्ण केले.`;
      } else if (lang === 'hi') {
        speech = `कार्य "${matchedTask.title}" पूरा मार्क कर दिया गया है।`;
        confirm = `कार्य "${matchedTask.title}" सफलतापूर्वक पूरा हुआ।`;
      } else if (lang === 'te') {
        speech = `టాస్క్ "${matchedTask.title}" పూర్తయినట్లు నమోదు చేయబడింది.`;
        confirm = `టాస్క్ "${matchedTask.title}" విజయవంతంగా పూర్తయింది.`;
      }

      return {
        handled: true,
        action: 'complete',
        targetTaskId: matchedTask.id,
        task: matchedTask,
        title: matchedTask.title,
        speechReply: speech,
        confirmationText: confirm
      };
    } else {
      let speech = "I couldn't find that specific task to complete. Here are your current active tasks.";
      if (lang === 'mr') speech = "पूर्ण करण्यासाठी ते काम सापडले नाही. कृपया कामाचा क्रमांक किंवा नाव सांगा.";
      else if (lang === 'hi') speech = "पूरा करने के लिए वह कार्य नहीं मिला। कृपया कार्य का नाम या नंबर बताएं।";
      else if (lang === 'te') speech = "పూర్తి చేయడానికి ఆ టాస్క్ కనుగొనబడలేదు. దయచేసి టాస్క్ పేరు చెప్పండి.";

      return {
        handled: true,
        action: 'complete',
        speechReply: speech,
        confirmationText: "Could not identify task to mark completed."
      };
    }
  }

  // 2. DELETE / REMOVE COMMANDS
  const isDelete =
    /^(?:delete|remove|cancel|discard)\s+(?:the\s+)?(?:task\s+)?(.+)/i.test(text) ||
    /हटवा|काढून टाका|हटाओ|रद्द|తొలగించు|తీసివేయి/i.test(text);

  if (isDelete) {
    const match = text.match(/^(?:delete|remove|cancel|discard)\s+(?:the\s+)?(?:task\s+)?(.+)/i);
    const queryPart = match ? match[1].replace(/^(?:the\s+|task\s+)/i, '').trim() : text;
    const matchedTask = queryPart ? findMatchingTask(queryPart, existingTasks) : null;

    if (matchedTask) {
      let speech = `Deleted task "${matchedTask.title}".`;
      let confirm = `Task "${matchedTask.title}" removed from your schedule.`;

      if (lang === 'mr') {
        speech = `काम "${matchedTask.title}" वेळापत्रकातून यशस्वीरित्या हटवले आहे.`;
        confirm = `काम "${matchedTask.title}" हटवले.`;
      } else if (lang === 'hi') {
        speech = `कार्य "${matchedTask.title}" सफलतापूर्वक हटा दिया गया है।`;
        confirm = `कार्य "${matchedTask.title}" हटा दिया गया।`;
      } else if (lang === 'te') {
        speech = `టాస్క్ "${matchedTask.title}" విజయవంతంగా తొలగించబడింది.`;
        confirm = `టాస్క్ "${matchedTask.title}" తొలగించబడింది.`;
      }

      return {
        handled: true,
        action: 'delete',
        targetTaskId: matchedTask.id,
        task: matchedTask,
        title: matchedTask.title,
        speechReply: speech,
        confirmationText: confirm
      };
    } else {
      let speech = "I couldn't locate that task to delete. Please specify the task name or number.";
      if (lang === 'mr') speech = "हटवण्यासाठी ते काम सापडले नाही. कृपया कामाचा क्रमांक तपासा.";
      else if (lang === 'hi') speech = "हटाने के लिए कार्य नहीं मिला। कृपया कार्य का नंबर जांचें।";
      else if (lang === 'te') speech = "తొలగించడానికి టాస్క్ దొరకలేదు. దయచేసి టాస్క్ నంబర్ సరిచూడండి.";

      return {
        handled: true,
        action: 'delete',
        speechReply: speech,
        confirmationText: "Could not find task to delete."
      };
    }
  }

  // 3. UPDATE / RESCHEDULE COMMANDS
  const isUpdate =
    /(?:update|reschedule|postpone|change\s+time\s+of|change\s+due\s+date\s+of)\s+(?:task\s+)?(.+)/i.test(text) ||
    /वेळ बदला|समय बदलो|సమయం మార్చండి/i.test(text);

  if (isUpdate) {
    const match = text.match(/(?:update|reschedule|postpone|change\s+time\s+of|change\s+due\s+date\s+of)\s+(?:task\s+)?(.+)/i);
    const raw = match ? match[1] : text;

    const parts = raw.split(/\s+(?:to|for|at|due|ला|को|కి)\s+/i);
    const taskQuery = parts[0]?.trim() || '';
    const newTimeStr = parts.slice(1).join(' ') || 'Tomorrow';

    const matchedTask = taskQuery ? findMatchingTask(taskQuery, existingTasks) : existingTasks[0];
    const { dueDate } = extractTimeAndDue(newTimeStr);

    if (matchedTask) {
      let speech = `Updated task "${matchedTask.title}". New schedule is ${dueDate}.`;
      let confirm = `Task "${matchedTask.title}" rescheduled for ${dueDate}.`;

      if (lang === 'mr') {
        speech = `काम "${matchedTask.title}" चे वेळापत्रक ${dueDate} साठी अद्ययावत केले आहे.`;
        confirm = `काम "${matchedTask.title}" ${dueDate} ला निश्चित केले.`;
      } else if (lang === 'hi') {
        speech = `कार्य "${matchedTask.title}" का समय ${dueDate} के लिए निर्धारित किया गया है।`;
        confirm = `कार्य "${matchedTask.title}" ${dueDate} के लिए अपडेट हुआ।`;
      } else if (lang === 'te') {
        speech = `టాస్క్ "${matchedTask.title}" సమయం ${dueDate} కి మార్చబడింది.`;
        confirm = `టాస్క్ "${matchedTask.title}" ${dueDate} కి అప్‌డేట్ చేయబడింది.`;
      }

      return {
        handled: true,
        action: 'update',
        targetTaskId: matchedTask.id,
        task: matchedTask,
        title: matchedTask.title,
        dueDate,
        speechReply: speech,
        confirmationText: confirm
      };
    }
  }

  // 4. CREATE / ADD NEW TASK COMMANDS
  const isCreate =
    /^(?:add|create|schedule|set\s+up|make)\s+(?:a\s+)?(?:new\s+)?(?:task|reminder|work\s+order)\s*(.*)/i.test(text) ||
    /^(?:new\s+task)\s*(.*)/i.test(text) ||
    /नवीन काम|नया काम|नया कार्य|కొత్త టాస్క్|కొత్త పని/i.test(text);

  if (isCreate) {
    let payload = '';
    const m1 = text.match(/^(?:add|create|schedule|set\s+up|make)\s+(?:a\s+)?(?:new\s+)?(?:task|reminder|work\s+order)\s*(.*)/i);
    const m2 = text.match(/^(?:new\s+task)\s*(.*)/i);
    if (m1 && m1[1]) payload = m1[1];
    else if (m2 && m2[1]) payload = m2[1];
    else {
      payload = text.replace(/(?:नवीन काम|नया काम|नया कार्य|కొత్త టాస్క్|కొత్త పని)/i, '').trim();
    }

    payload = payload.trim();
    if (!payload) {
      payload = lang === 'mr' ? 'शेती पाहणी व सिंचन तपासणी' : lang === 'hi' ? 'खेत निरीक्षण और सिंचाई जांच' : lang === 'te' ? 'పొలం పరిశీలన మరియు నీటి తనిఖీ' : 'Field Inspection & Irrigation Check';
    }

    const { dueDate, cleanText } = extractTimeAndDue(payload);
    const { fieldId, fieldName } = extractField(cleanText, currentField, allFields);

    let finalTitle = cleanText
      .replace(/(?:in|for|at|मध्ये|में|లో)\s+(?:the\s+)?(?:mango|tomato|strawberry|field|parcel).*/i, '')
      .replace(/^(?:to\s+|that\s+)/i, '')
      .trim();

    if (!finalTitle || finalTitle.length < 3) {
      finalTitle = payload;
    }

    finalTitle = finalTitle.charAt(0).toUpperCase() + finalTitle.slice(1);

    let speech = `Added new task "${finalTitle}" scheduled for ${dueDate || 'Today'} in ${fieldName}.`;
    let confirm = `New task created: "${finalTitle}" (${dueDate || 'Today'})`;

    if (lang === 'mr') {
      speech = `नवीन काम "${finalTitle}" ${dueDate || 'आज'} साठी ${fieldName} मध्ये जोडले आहे.`;
      confirm = `नवीन काम तयार केले: "${finalTitle}"`;
    } else if (lang === 'hi') {
      speech = `नया कार्य "${finalTitle}" ${dueDate || 'आज'} के लिए ${fieldName} में जोड़ दिया गया है।`;
      confirm = `नया कार्य बनाया गया: "${finalTitle}"`;
    } else if (lang === 'te') {
      speech = `కొత్త టాస్క్ "${finalTitle}" ${dueDate || 'ఈరోజు'} కి ${fieldName} లో జోడించబడింది.`;
      confirm = `కొత్త టాస్క్ సృష్టించబడింది: "${finalTitle}"`;
    }

    return {
      handled: true,
      action: 'create',
      title: finalTitle,
      dueDate: dueDate || 'Today',
      fieldId,
      fieldName,
      speechReply: speech,
      confirmationText: confirm
    };
  }

  return { handled: false };
}

