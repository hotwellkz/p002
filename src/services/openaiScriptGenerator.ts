import type { Channel } from "../domain/channel";

export interface ScriptSection {
  hook?: string;
  mainAction?: string;
  finale?: string;
  onScreenText?: string;
  voiceover?: string;
  sounds?: string;
}

export interface GeneratedScript {
  sections: ScriptSection;
  rawText: string;
}

const PLATFORM_NAMES: Record<Channel["platform"], string> = {
  YOUTUBE_SHORTS: "YouTube Shorts",
  TIKTOK: "TikTok",
  INSTAGRAM_REELS: "Instagram Reels",
  VK_CLIPS: "VK Клипы"
};

const LANGUAGE_NAMES: Record<Channel["language"], string> = {
  ru: "русском",
  en: "English",
  kk: "қазақ"
};

function buildSystemPrompt(channel: Channel): string {
  const platformName = PLATFORM_NAMES[channel.platform];
  const languageName = LANGUAGE_NAMES[channel.language];

  return `Ты — профессиональный сценарист для коротких вертикальных видео (${platformName}).

Твоя задача — создавать структурированные сценарии, адаптированные под следующие параметры:

**Платформа:** ${platformName}
**Длительность:** ${channel.targetDurationSec} секунд
**Язык:** ${languageName}
**Ниша:** ${channel.niche}
**Целевая аудитория:** ${channel.audience}
**Тон/Стиль:** ${channel.tone}
${channel.blockedTopics ? `**Запрещённые темы:** ${channel.blockedTopics}` : ""}
${channel.extraNotes ? `**Дополнительные пожелания:** ${channel.extraNotes}` : ""}

**Требования к формату ответа:**

Верни JSON объект со следующей структурой:
{
  "hook": "Завязка (первые 2-3 секунды, должна зацепить внимание)",
  "mainAction": "Основное действие (развитие сюжета, ключевые моменты)",
  "finale": "Финал (кульминация, призыв к действию, запоминающийся момент)",
  "onScreenText": "Текст на экране (субтитры, ключевые фразы)",
  "voiceover": "Реплики/голос за кадром (точный текст для озвучки)",
  "sounds": "Рекомендации по звукам/музыке (описание атмосферы, эффекты)"
}

**Важно:**
- Сценарий должен точно укладываться в ${channel.targetDurationSec} секунд
- Используй тон "${channel.tone}"
- Учитывай целевую аудиторию: ${channel.audience}
- Адаптируй под специфику ${platformName}
- ${channel.blockedTopics ? `Избегай тем: ${channel.blockedTopics}` : ""}
- Все тексты должны быть на ${languageName} языке

Верни ТОЛЬКО валидный JSON, без дополнительных комментариев.`;
}

function parseScriptResponse(responseText: string): ScriptSection {
  try {
    // Пытаемся найти JSON в ответе (на случай, если есть дополнительные комментарии)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        hook: parsed.hook || "",
        mainAction: parsed.mainAction || "",
        finale: parsed.finale || "",
        onScreenText: parsed.onScreenText || "",
        voiceover: parsed.voiceover || "",
        sounds: parsed.sounds || ""
      };
    }
    throw new Error("JSON не найден в ответе");
  } catch (error) {
    // Если парсинг не удался, возвращаем структурированный текст
    console.error("Ошибка парсинга JSON:", error);
    return {
      hook: "",
      mainAction: responseText,
      finale: "",
      onScreenText: "",
      voiceover: "",
      sounds: ""
    };
  }
}

export async function generateShortScript(
  channel: Channel,
  idea: string
): Promise<GeneratedScript> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OpenAI API ключ не настроен. Добавьте VITE_OPENAI_API_KEY в .env файл"
    );
  }

  const systemPrompt = buildSystemPrompt(channel);
  const userPrompt = `Создай сценарий для короткого видео на тему: "${idea}"`;

  const model = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";
  
  // response_format поддерживается не всеми моделями
  const supportsJsonMode = model.includes("gpt-4") || model.includes("o3");
  
  const requestBody: Record<string, unknown> = {
    model,
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userPrompt
      }
    ],
    temperature: 0.8,
    max_tokens: 1500
  };

  if (supportsJsonMode) {
    requestBody.response_format = { type: "json_object" };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message ||
          `OpenAI API ошибка: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Пустой ответ от OpenAI API");
    }

    const sections = parseScriptResponse(content);

    return {
      sections,
      rawText: content
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Неизвестная ошибка при генерации сценария");
  }
}

