import type { Conversation, Message } from "@/types/conversation";

const now = Date.now();
const hour = 60 * 60 * 1000;
const day = 24 * hour;

function msg(
  id: string,
  role: Message["role"],
  content: string,
  offsetMs: number,
  type: Message["type"] = "text",
): Message {
  return {
    id,
    role,
    content,
    timestamp: new Date(now - offsetMs),
    type,
    speakableText: content,
  };
}

export const mockConversations: Conversation[] = [
  {
    id: "conv-cow-fever",
    title: "Cow Fever Case",
    createdAt: new Date(now - 3 * day),
    updatedAt: new Date(now - 2 * hour),
    messages: [
      msg("m1", "user", "My cow has fever and is not eating.", 2 * hour),
      msg(
        "m2",
        "assistant",
        "Possible disease: Foot-and-Mouth Disease (FMD).\n\nSeverity: Urgent\nConfidence: 78%\n\nFirst aid:\n• Isolate the animal immediately\n• Provide clean water and soft feed\n• Contact your nearest veterinarian within 24 hours",
        2 * hour - 60000,
      ),
    ],
  },
  {
    id: "conv-goat-infection",
    title: "Goat Infection",
    createdAt: new Date(now - 5 * day),
    updatedAt: new Date(now - 1 * day),
    messages: [
      msg(
        "m3",
        "user",
        "My goat has swelling in the front leg and limping.",
        1 * day,
      ),
      msg(
        "m4",
        "assistant",
        "Possible condition: Joint infection or abscess.\n\nSeverity: Urgent\n\nRecommended: Clean the affected area with antiseptic and restrict movement. A vet should examine the leg within 48 hours.",
        1 * day - 120000,
      ),
    ],
  },
  {
    id: "conv-buffalo-health",
    title: "Buffalo Health",
    createdAt: new Date(now - 7 * day),
    updatedAt: new Date(now - 3 * day),
    messages: [
      msg(
        "m5",
        "user",
        "Buffalo showing weakness and reduced milk yield for 3 days.",
        3 * day,
      ),
      msg(
        "m6",
        "assistant",
        "Possible causes include nutritional deficiency, mastitis, or parasitic infection.\n\nSeverity: Self-Treatable (monitor closely)\n\nEnsure adequate green fodder, mineral supplements, and clean drinking water.",
        3 * day - 90000,
      ),
    ],
  },
];

export const defaultConversationId = mockConversations[0]?.id ?? null;

/** Quick-start messages for docs / tests */
export const sampleMessages = [
  { role: "user" as const, content: "My cow has fever" },
  {
    role: "assistant" as const,
    content: "Possible disease: FMD. Severity: Urgent. Contact a veterinarian.",
  },
];
