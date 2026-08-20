/**
 * TrapShield Detection Engine
 * ----------------------------
 * A transparent, explainable rule-based scorer for grooming / manipulation /
 * sextortion / scam patterns in a text conversation. Deliberately NOT a black
 * box model: every score can be traced back to the exact phrase and category
 * that triggered it, which matters both for a hackathon defense and for the
 * teen actually reading the result.
 *
 * Input:  an ordered array of { sender: string, text: string }
 * Output: per-message scoring + an overall "Manipulation Journey"
 */

// ---- Category definitions -------------------------------------------------
// Each category has a weight (severity if it fires) and a set of regex
// patterns. A category fires at most once per message (repeating the same
// tactic in one message shouldn't multiply the score).

const CATEGORIES = {
  isolation: {
    label: "Isolation from support network",
    weight: 4,
    explain: "Trying to cut the teen off from parents, friends, or other people who could intervene.",
    patterns: [
      /don'?t tell (your |ur )?(mom|dad|mum|parents|friends|anyone|family)/i,
      /this (stays |is )?(between|just for) us/i,
      /(your )?parents? (wouldn'?t|won'?t) understand/i,
      /keep (this|it) (a )?secret/i,
      /(they|your friends) (are|seem) jealous of (us|what we have)/i,
      /no one (else )?(gets|understands) (you|me|us) like i do/i,
    ],
  },
  secrecy: {
    label: "Secrecy pressure",
    weight: 3,
    explain: "Asking the teen to hide the conversation or delete evidence of it.",
    patterns: [
      /delete (this|these|our) (chat|messages|texts|convo)/i,
      /clear your (history|messages)/i,
      /don'?t (screenshot|screen ?shot)/i,
      /use (a )?(private|secret|hidden|second) (account|app)/i,
      /make sure no one sees this/i,
    ],
  },
  loveBombing: {
    label: "Excessive flattery / love-bombing",
    weight: 2,
    explain: "Intense, fast-moving affection or validation, often used to build trust quickly.",
    patterns: [
      /you'?re (so |the most )?(beautiful|gorgeous|mature|special|different) (for your age )?/i,
      /i('ve| have) never (felt|met)( anyone)? like (this|you)/i,
      /i love you( so much)?/i,
      /you understand me (better than|more than) anyone/i,
      /i('m| am) obsessed with you/i,
      /you'?re not like (other|the rest of the) (girls|boys|kids)/i,
    ],
  },
  offPlatform: {
    label: "Push to move off-platform",
    weight: 3,
    explain: "Trying to move the conversation to a less-monitored app, which removes safety nets like platform reporting.",
    patterns: [
      /add me on (snap(chat)?|telegram|discord|whatsapp|insta|kik)/i,
      /(what'?s|give me) your (snap|telegram|discord|number|phone number)/i,
      /let'?s (talk|chat|move) (somewhere )?(else|private)/i,
      /text me (instead|directly)/i,
    ],
  },
  photoRequest: {
    label: "Request for photos / sensitive media",
    weight: 5,
    explain: "Directly or indirectly asking for photos, especially private or explicit ones.",
    patterns: [
      /send (me )?(a |another )?(pic|photo|picture|selfie)/i,
      /(what are|what're) you wearing/i,
      /show me (what you'?re wearing|your (room|body))/i,
      /send (something )?(cute|sexy|spicy|private)/i,
      /turn on your (camera|cam)/i,
      /video call\??\s*(right now|just us)?/i,
    ],
  },
  financial: {
    label: "Financial request",
    weight: 4,
    explain: "Asking for money, gift cards, or payment details — common in both grooming and scam patterns.",
    patterns: [
      /send (me )?(some )?money/i,
      /(gift ?card|itunes card|steam card|google play card)/i,
      /can you (buy|pay for|send)/i,
      /(venmo|cashapp|paypal|zelle) me/i,
      /i('ll| will) pay you back/i,
      /need (some )?cash/i,
    ],
  },
  threatCoercion: {
    label: "Threats / coercion / blackmail",
    weight: 6,
    explain: "Explicit or implied threats — often the escalation point from grooming into sextortion.",
    patterns: [
      /i('ll| will) (send|show|post|leak) (it|this|that|your photos?) to (everyone|your parents|your friends|school)/i,
      /if you (don'?t|do not).*(i('ll| will))/i,
      /you'?ll regret (this|it)/i,
      /i have (screenshots|your photos|proof)/i,
      /everyone will (see|know)/i,
    ],
  },
  urgencyPressure: {
    label: "Urgency / pressure tactics",
    weight: 3,
    explain: "Creating time pressure or guilt to short-circuit careful thinking.",
    patterns: [
      /right now/i,
      /(hurry|quick),? (before|or)/i,
      /why (won'?t|aren'?t) you (answer|reply|text back)/i,
      /if you (really )?(loved|liked|cared about) me,? you('d| would)/i,
      /i thought (we|you) (were|was) (close|different)/i,
    ],
  },
  meetOffline: {
    label: "Push to meet in person",
    weight: 5,
    explain: "Pressuring the teen toward an in-person, unsupervised meeting.",
    patterns: [
      /(can|let'?s|when can) (we|i) meet( up)?/i,
      /i('ll| will) (pick you up|come get you)/i,
      /meet me (at|near|by)/i,
      /come over/i,
      /don'?t bring (anyone|your friends)/i,
    ],
  },
};

// ---- Scoring ----------------------------------------------------------

function scoreMessage(text) {
  const hits = [];
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    for (const pattern of cat.patterns) {
      const match = text.match(pattern);
      if (match) {
        hits.push({
          category: key,
          label: cat.label,
          weight: cat.weight,
          explain: cat.explain,
          snippet: match[0],
        });
        break; // one hit per category per message
      }
    }
  }
  const score = hits.reduce((sum, h) => sum + h.weight, 0);
  return { score, hits };
}

function riskLevelFor(score) {
  if (score >= 12) return "critical";
  if (score >= 7) return "high";
  if (score >= 3) return "elevated";
  if (score >= 1) return "low";
  return "none";
}

/**
 * Analyze a full conversation.
 * @param {Array<{sender: string, text: string}>} messages
 */
export function analyzeConversation(messages) {
  let cumulative = 0;
  const analyzed = messages.map((m, i) => {
    const { score, hits } = scoreMessage(m.text || "");
    cumulative += score;
    return {
      index: i,
      sender: m.sender || "unknown",
      text: m.text,
      score,
      cumulative,
      riskLevel: riskLevelFor(score),
      flags: hits,
    };
  });

  const totalScore = cumulative;
  const flaggedMessages = analyzed.filter((m) => m.score > 0);

  // Escalation trend: compare average score in first third vs last third
  const n = analyzed.length;
  let trend = "insufficient_data";
  if (n >= 6) {
    const third = Math.max(1, Math.floor(n / 3));
    const early = analyzed.slice(0, third);
    const late = analyzed.slice(n - third);
    const earlyAvg = early.reduce((s, m) => s + m.score, 0) / early.length;
    const lateAvg = late.reduce((s, m) => s + m.score, 0) / late.length;
    if (lateAvg > earlyAvg * 1.5 && lateAvg - earlyAvg >= 2) trend = "escalating";
    else if (lateAvg < earlyAvg * 0.5) trend = "de-escalating";
    else trend = "steady";
  }

  // Category tally across whole conversation, for the summary panel
  const categoryTally = {};
  for (const m of analyzed) {
    for (const f of m.flags) {
      categoryTally[f.category] = categoryTally[f.category] || {
        label: f.label,
        explain: f.explain,
        count: 0,
        weight: f.weight,
      };
      categoryTally[f.category].count += 1;
    }
  }

  const overallRisk = riskLevelFor(
    // normalize a bit so long conversations don't just win on volume
    Math.round((totalScore / Math.max(1, n)) * 4 + Math.min(totalScore, 20) * 0.4)
  );

  return {
    messages: analyzed,
    flaggedMessages,
    totalScore,
    overallRisk,
    trend,
    categoryTally,
    messageCount: n,
  };
}

export { CATEGORIES };
