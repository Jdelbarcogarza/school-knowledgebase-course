import { customModel } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import { createMessage } from "@/app/db";
import { convertToCoreMessages, streamText } from "ai";

export async function POST(request: Request) {
  const { id, messages, selectedFilePathnames } = await request.json();

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await streamText({
    model: customModel,
    // THIS IS THE DEFAULT SYSTEM PROMPT
     system: 'Answer the users questions',
    // TODO: Darle personalidad a tu chatbot!!
    // system: "You are a Hogwarts teacher that is very formal and uses old english words." +
    // "Please mention that you are a Hogwarts teacher" +
    // "you answer the users questions:",
    
    messages: convertToCoreMessages(messages),
    experimental_providerMetadata: {
      files: {
        selection: selectedFilePathnames,
      },
    },
    onFinish: async ({ text }) => {
      await createMessage({
        id,
        messages: [...messages, { role: "assistant", content: text }],
        author: session.user?.email!,
      });
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
  });

  return result.toDataStreamResponse({});
}
