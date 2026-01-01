
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ReviewStyle, PlantAnalysis, RawSceneInput } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function analyzePlantAndHints(
  scenes: RawSceneInput[], 
  style: ReviewStyle
): Promise<PlantAnalysis> {
  const imageParts = scenes.map(s => ({
    inlineData: {
      data: s.imageUrl.split(',')[1],
      mimeType: 'image/jpeg'
    }
  }));

  const hintsText = scenes.map((s, i) => `Phân cảnh ${i+1}: ${s.hint}`).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        role: 'user',
        parts: [
          ...imageParts,
          { text: `Bạn là một người yêu cây cảnh chuyên nghiệp đang thực hiện một video review thực tế cho khách hàng. 
          Ngôn ngữ: Tiếng Việt tự nhiên, gần gũi, như một vlogger đang chia sẻ trải nghiệm cá nhân (dùng các từ như 'mọi người ơi', 'ưng quá', 'nhìn nè').
          
          Nhiệm vụ:
          1. Phân tích loại cây này (tên tiếng Việt, tên khoa học, mô tả ngắn gọn).
          2. Đưa ra 3 mẹo chăm sóc thực tế nhất.
          3. Dựa trên các gợi ý kịch bản của người dùng, hãy viết lại thành một kịch bản hoàn chỉnh, trôi chảy theo phong cách '${style}'.
          
          QUY TẮC QUAN TRỌNG:
          - Kịch bản phải có đúng ${scenes.length} đoạn, mỗi đoạn tương ứng với một hình ảnh/phân cảnh người dùng cung cấp.
          - Nội dung mỗi đoạn phải ăn khớp tuyệt đối với hình ảnh và gợi ý của phân cảnh đó.
          - Văn phong phải chân thực như khách hàng chụp và review lại, không robot, không lý thuyết suông.
          
          Gợi ý từ người dùng:
          ${hintsText}` }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          scientificName: { type: Type.STRING },
          description: { type: Type.STRING },
          careTips: { type: Type.ARRAY, items: { type: Type.STRING } },
          polishedScripts: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Mảng các chuỗi kịch bản tiếng Việt đã được trau chuốt, mỗi phần tương ứng với 1 phân cảnh."
          }
        },
        required: ["name", "scientificName", "description", "careTips", "polishedScripts"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateTTS(text: string, style: ReviewStyle): Promise<Uint8Array> {
  // Thêm tiền tố cảm xúc để AI đọc giọng tự nhiên hơn tùy theo phong cách
  let emotivePrompt = text;
  if (style === ReviewStyle.ENTHUSIASTIC) emotivePrompt = `Nói một cách cực kỳ hào hứng và năng lượng: ${text}`;
  else if (style === ReviewStyle.RELAXING) emotivePrompt = `Nói một cách nhẹ nhàng, thư thái và truyền cảm: ${text}`;
  else emotivePrompt = `Nói một cách tự nhiên, chân thành như đang trò chuyện: ${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: emotivePrompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore thường có ngữ điệu tốt cho review
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Không thể tạo giọng nói");
  
  return decodeBase64(base64Audio);
}

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
