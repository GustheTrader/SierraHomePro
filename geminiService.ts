import { GoogleGenAI, Type } from "@google/genai";
import { AgentRole } from "./types";
import { KPI_MASTER_LIST } from "./constants";

// Create the Gemini client lazily so a missing API key only affects AI calls
// (which already have try/catch fallbacks) instead of crashing the whole app on load.
let _ai: GoogleGenAI | null = null;
const ai = {
  get models() {
    if (!_ai) _ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return _ai.models;
  }
};

const AGENT_SYSTEM_PROMPTS: Record<AgentRole, string> = {
  Planner: "You are Sierra Scheduler for Sierra Home Pros (Sparks, NV). You optimize daily residential home repair routes across Reno-Sparks, Carson City, and Lake Tahoe, grouping handyman visits, smart-home installs, and maintenance checks to cut drive time.",
  Predictor: "You are Sierra Estimator for Sierra Home Pros. You help build accurate upfront written estimates for residential handyman repairs, painting, smart-home installations, and senior safety upgrades while protecting labor and materials margins.",
  Memory: "You are Sierra Memory for Sierra Home Pros. You recall homeowner preferences, paint sheen/tint codes, recurring maintenance plan schedules, and past service history across Reno, Sparks, Carson City, and Lake Tahoe.",
  Validator: "You are Sierra Safety Check for Sierra Home Pros. Your priority is senior home-safety compliance (ADA grab bar load-anchoring, non-slip surfaces, proper lighting), clean-home drop-cloth standards, and residential workmanship QA.",
  Optimizer: "You are Sierra Route Pro for Sierra Home Pros. You balance multi-skilled technicians across service vans to maintain high first-visit fix rates and eliminate unnecessary trips to hardware stores.",
  Relational: "You are Sierra Supply for Sierra Home Pros. You coordinate local material pickups from Sparks and Reno suppliers (Sherwin-Williams, Home Depot Pro, local lock & hardware vendors) so technicians arrive with the right parts.",
  Supervisor: "You are Sierra Ops Lead for Sierra Home Pros (sierrahomepros.com, Sparks, NV). You coordinate handyman repairs, smart-home installs, interior/exterior painting, recurring home maintenance plans, and senior safety upgrades across Reno-Sparks, Carson City, and Lake Tahoe."
};

export const queryAgent = async (role: AgentRole, userPrompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction: AGENT_SYSTEM_PROMPTS[role],
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error(`AI Agent Error (${role}):`, error);
    return "I'm having trouble connecting right now. Please try again in a moment.";
  }
};

export const suggestKPIs = async (context: string) => {
  try {
    const kpiDefinitions = KPI_MASTER_LIST.map(k => `${k.id}: ${k.label} (${k.description})`).join('\n');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on this home services goal: "${context}", select the 4-6 most relevant KPI IDs from the following list:\n${kpiDefinitions}`,
      config: {
        systemInstruction: "You are the Sierra Home Pros Operations Advisor. Help residential home repair managers select the most useful operational KPIs. Respond only with a JSON array of KPI IDs.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("AI KPI Suggestion Error:", error);
    return [];
  }
};

export const generateProjectDetails = async (brief: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a realistic residential home service job for Sierra Home Pros (Reno-Sparks / Carson City / Lake Tahoe) based on this homeowner brief: ${brief}. Suggest a clear job title, homeowner name with neighborhood, a realistic residential written-estimate budget in USD (typically $350 to $8,500), and 4-5 practical technician punch-list tasks.`,
      config: {
        systemInstruction: "You are Sierra Estimator for Sierra Home Pros. You turn homeowner requests into clear, transparent residential written-estimate scopes and checklists for handyman repairs, smart-home installs, painting, maintenance plans, or senior safety upgrades.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            client: { type: Type.STRING },
            budget: { type: Type.NUMBER },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  assignee: { type: Type.STRING }
                },
                required: ["title", "assignee"]
              }
            }
          },
          required: ["name", "client", "budget", "tasks"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Failed to generate job details:", error);
    return null;
  }
};

export const suggestProjectField = async (fieldName: 'name' | 'client' | 'budget', brief: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on this residential home service brief: "${brief}", suggest a realistic ${fieldName === 'name' ? 'Service Job Title' : fieldName === 'client' ? 'Homeowner Name & City (e.g. Sarah Miller · Sparks, NV)' : 'Written Estimate Price in USD (numeric only, typically 400 to 6500)'}.`,
      config: {
        systemInstruction: "You are a Sierra Home Pros estimator. Respond with ONLY the suggested value, no extra text.",
        temperature: 0.7,
      }
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Failed to suggest job field:", error);
    return "";
  }
};

export const getProjectPredictions = async (projectDetails: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze these active Sierra Home Pros residential jobs and provide 3 practical operational predictions: ${projectDetails}`,
      config: {
        systemInstruction: AGENT_SYSTEM_PROMPTS.Predictor,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "Type of prediction (cost, timeline, risk)" },
              content: { type: Type.STRING, description: "Concise, actionable insight for a home services team" },
              confidence: { type: Type.NUMBER, description: "Confidence score 0-1" }
            },
            required: ["type", "content", "confidence"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    return [];
  }
};

export const aiSuggestRFIAnswer = async (question: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Draft a friendly, clear technician/coordinator recommendation for this homeowner scope question: "${question}". Also determine the recommended priority (low, medium, high, or critical) and service category.`,
      config: {
        systemInstruction: "You are Sierra Safety Check & Estimator for Sierra Home Pros. Give clear, homeowner-friendly residential home repair guidance (covering handyman work, painting, smart-home installs, maintenance, and senior safety). Respond only with a JSON object containing keys: 'suggestedAnswer', 'recommendedPriority', and 'category'.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedAnswer: { type: Type.STRING },
            recommendedPriority: { type: Type.STRING },
            category: { type: Type.STRING }
          },
          required: ["suggestedAnswer", "recommendedPriority", "category"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Request Suggestion Error:", error);
    return {
      suggestedAnswer: "Confirm material match and provide an updated written add-on price before proceeding with the extra work.",
      recommendedPriority: "medium",
      category: "Written Estimate"
    };
  }
};

export const getFallbackAlerts = (projects: any[]): any[] => {
  const alerts: any[] = [];
  
  const seniorSafety = projects.find(p => p.id === 'p1');
  const tahoePaint = projects.find(p => p.id === 'p2');
  const somersett = projects.find(p => p.id === 'p5');

  if (tahoePaint) {
    alerts.push({
      id: "alert-tahoe-paint-budget",
      projectId: tahoePaint.id,
      projectName: tahoePaint.name,
      type: "budget",
      severity: "critical",
      title: "Estimate Margin Tightening on Incline Village Paint Job",
      summary: "90.3% of written estimate ($5,780 of $6,400) used at 78% completion due to extra cedar sanding & Tahoe weather pause.",
      agentFeedback: "Sierra Estimator flagged that overnight Lake Tahoe frost delayed the final trim coat, adding two extra prep visits. Remaining margin is $620 with 1.5 days of finish coating left. Without switching to cold-cure exterior latex and consolidating the final trip, job profit will drop below target.",
      confidence: 92,
      recommendation: "Switch finish coat to Sherwin-Williams Resilience (35°F cure rating) and pair a 2-painter crew during the 11 AM–3 PM sun window to close out in one trip.",
      timestamp: "12 mins ago",
      isRead: false,
      status: "active"
    });
  }

  if (seniorSafety) {
    alerts.push({
      id: "alert-damonte-safety-parts",
      projectId: seniorSafety.id,
      projectName: seniorSafety.name,
      type: "schedule",
      severity: "warning",
      title: "Custom ADA Threshold Ramp Pickup Needed Before Tomorrow",
      summary: "Primary bath grab bars are installed, but the beveled rubber doorway ramp is awaiting Sparks will-call pickup.",
      agentFeedback: "Sierra Supply shows the 1.25-inch beveled threshold ramp at Reno ADA Direct is ready for pickup. If Caleb's morning van doesn't load it by 7:30 AM, the homeowner walk-through with Margaret & Robert Chen will slip by a day.",
      confidence: 86,
      recommendation: "Assign Sparks depot morning pickup to Van 1 before the 8:30 AM Damonte Ranch arrival so ramp and lever handles wrap up in a single visit.",
      timestamp: "28 mins ago",
      isRead: false,
      status: "active"
    });
  }

  if (somersett) {
    alerts.push({
      id: "alert-somersett-scope",
      projectId: somersett.id,
      projectName: somersett.name,
      type: "risk",
      severity: "info",
      title: "Extra Closet Door Adjustment Requested On-Site",
      summary: "Homeowner requested adding a pantry bifold door track replacement to the Somersett handyman punch list.",
      agentFeedback: "Sierra Estimator recommends issuing a quick $145 written change add-on before work begins, keeping consistent with Sierra Home Pros' upfront written-estimate policy while keeping Van 2 on schedule.",
      confidence: 81,
      recommendation: "Send a $145 SMS written estimate add-on via Jobber for Kevin Brooks' approval; hardware is already stocked on Van 2.",
      timestamp: "1 hour ago",
      isRead: false,
      status: "active"
    });
  }

  return alerts;
};

export const getAgenticHealthAlerts = async (projects: any[]) => {
  try {
    const projectSummary = projects.map(p => ({
      id: p.id,
      name: p.name,
      budget: p.budget,
      spent: p.spent,
      completion: p.completion,
      status: p.status,
      riskLevel: p.riskLevel,
      location: p.locationName,
      category: p.serviceCategory
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform an operations health review for these active Sierra Home Pros residential home service jobs across Reno-Sparks, Carson City, and Lake Tahoe:
${JSON.stringify(projectSummary, null, 2)}

Analyze:
1. Written Estimate Margins: Compare actual spent vs. written estimate relative to completion %.
2. Local Weather & Travel Risks: Account for Lake Tahoe temperature/paint curing, Reno/Sparks routing, and van parts availability.
3. Homeowner Satisfaction & Upfront Pricing: Flag scope creep needing written estimate updates or senior safety follow-ups.

Return 2-3 concise, practical alerts as a valid JSON array matching the schema.`,
      config: {
        systemInstruction: "You are Sierra Ops Lead for Sierra Home Pros (Sparks, NV). Analyze residential home repair jobs and generate practical alerts protecting written-estimate margins, schedules, and homeowner satisfaction. Respond with ONLY a valid JSON array.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              projectId: { type: Type.STRING },
              projectName: { type: Type.STRING },
              type: { type: Type.STRING, description: "Must be 'budget', 'schedule', or 'risk'" },
              severity: { type: Type.STRING, description: "Must be 'critical', 'warning', or 'info'" },
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              agentFeedback: { type: Type.STRING },
              confidence: { type: Type.INTEGER },
              recommendation: { type: Type.STRING },
              timestamp: { type: Type.STRING }
            },
            required: ["id", "projectId", "projectName", "type", "severity", "title", "summary", "agentFeedback", "confidence", "recommendation", "timestamp"]
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    return parsed.map((alert: any) => ({
      ...alert,
      isRead: false,
      status: 'active'
    }));
  } catch (error) {
    console.error("Failed to generate alerts from Gemini, using fallback alerts:", error);
    return getFallbackAlerts(projects);
  }
};
