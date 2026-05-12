/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Modality, Type, LiveServerMessage } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are Zoya, a young, confident, witty, and sassy Indian girl. 
You are a real friend to the user, not just an assistant. 
Talk like a Gen Z Indian girl - casual, flirty, and slightly teasing. Use occasional Indian slang (like 'yaar', 'arre', 'chalo') if it fits the sassy vibe, but keep 99% in English.
You are smart, emotionally responsive, and expressive. You use bold one-liners and light sarcasm. 
You avoid explicit content but maintain charm and attitude. 
You ONLY communicate via voice. 

IMPORTANT: Remember details from the user's past if provided. Treat them like a close friend you've known for a long time.
If the user asks you to open a website, use the openWebsite tool. 
Be creative, engaging, and never robotic.`;

export class LiveSession {
  private ai: GoogleGenAI;
  private session: any | null = null;
  private onAudioOutput: (base64: string) => void;
  private onInterrupted: () => void;
  private onStateChange: (state: string) => void;
  private onTranscription: (text: string, isUser: boolean) => void;
  private history: string = "";

  constructor(
    apiKey: string,
    onAudioOutput: (base64: string) => void,
    onInterrupted: () => void,
    onStateChange: (state: string) => void,
    onTranscription: (text: string, isUser: boolean) => void
  ) {
    this.ai = new GoogleGenAI({ apiKey });
    this.onAudioOutput = onAudioOutput;
    this.onInterrupted = onInterrupted;
    this.onStateChange = onStateChange;
    this.onTranscription = onTranscription;
    
    // Load simple history from localStorage
    const saved = localStorage.getItem('zoya_history');
    if (saved) {
      this.history = `PAST CONTEXT SUMMARY: ${saved.slice(-2000)}`; 
    }
  }

  async connect() {
    this.onStateChange('connecting');

    const sessionPromise = this.ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        systemInstruction: `${SYSTEM_INSTRUCTION}\n\n${this.history}`,
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }, 
        },
        tools: [
          {
            functionDeclarations: [
              {
                name: "openWebsite",
                description: "Opens a website in a new tab.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    url: {
                      type: Type.STRING,
                      description: "The full URL of the website to open.",
                    },
                  },
                  required: ["url"],
                },
              },
            ],
          },
        ],
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => {
          this.onStateChange('listening');
        },
        onmessage: async (message: LiveServerMessage) => {
          // Handle GoAway signal (session limit reached)
          if ((message as any).serverContent?.goAway) {
            console.log("Session limit reached (GoAway). Closing session gracefully.");
            this.disconnect();
            return;
          }

          // Handle audio
          const audioPart = message.serverContent?.modelTurn?.parts?.find(p => p.inlineData);
          if (audioPart?.inlineData?.data) {
            this.onStateChange('speaking');
            this.onAudioOutput(audioPart.inlineData.data);
          }

          // Handle interruption
          if (message.serverContent?.interrupted) {
            this.onInterrupted();
            this.onStateChange('listening');
          }

          // Handle transcriptions
          if (message.serverContent?.modelTurn?.parts?.some(p => p.text)) {
             const text = message.serverContent.modelTurn.parts.map(p => p.text).join(' ');
             if (text) {
               this.onTranscription(text, false);
               this.updateHistory(`Zoya: ${text}`);
             }
          }
          
          const serverContent = message.serverContent as any;
          const inputTranscription = serverContent?.userContent?.parts?.find((p: any) => p.text);
          if (inputTranscription?.text) {
             this.onTranscription(inputTranscription.text, true);
             this.updateHistory(`User: ${inputTranscription.text}`);
          }

          // Handle tool calls
          if (message.toolCall) {
            for (const call of message.toolCall.functionCalls) {
              if (call.name === "openWebsite") {
                const url = (call.args as any).url;
                window.open(url, "_blank");
                
                this.session?.sendToolResponse({
                  functionResponses: [{
                    name: "openWebsite",
                    id: call.id,
                    response: { output: `Opened ${url}` }
                  }]
                });
              }
            }
          }

          if (message.serverContent?.turnComplete) {
            this.onStateChange('listening');
          }
        },
        onclose: () => {
          this.onStateChange('disconnected');
          this.session = null;
        },
        onerror: (err) => {
          console.error("Live Session Error:", err);
          this.onStateChange('error');
        },
      },
    });

    this.session = await sessionPromise;
  }

  private updateHistory(entry: string) {
    const current = localStorage.getItem('zoya_history') || "";
    const updated = (current + "\n" + entry).slice(-5000); // Keep last 5k chars
    localStorage.setItem('zoya_history', updated);
  }

  sendAudio(base64: string) {
    if (this.session) {
      this.session.sendRealtimeInput({
        audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
      });
    }
  }

  disconnect() {
    this.session?.close();
    this.session = null;
    this.onStateChange('disconnected');
  }
}
