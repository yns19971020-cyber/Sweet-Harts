import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface PhotoVerificationResult {
  isSuspicious: boolean;
  confidence: number;
  reasons: string[];
  recommendation: string;
}

export async function verifyPhoto(base64Image: string): Promise<PhotoVerificationResult> {
  try {
    const imageUrl = base64Image.startsWith('data:') 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `You are a photo verification expert for a dating platform. Your job is to analyze selfie photos and detect if they might be fake, downloaded from the internet, or manipulated.

Look for these signs of fake/suspicious photos:
1. Professional studio lighting or stock photo quality
2. Watermarks or logos
3. Obvious photo editing or filters
4. Screenshots from social media
5. Photos of photos (screen capture of another image)
6. Celebrity or model-like appearance with perfect lighting
7. Low resolution suggesting downloaded/compressed images
8. Inconsistent lighting between face and background
9. Blurry edges suggesting cut-paste editing
10. Multiple people in the photo (should be single person selfie)

Respond ONLY with valid JSON in this exact format:
{
  "isSuspicious": true/false,
  "confidence": 0-100,
  "reasons": ["reason1", "reason2"],
  "recommendation": "approve" or "review" or "reject"
}

- "approve": Photo looks like a genuine selfie
- "review": Photo has some concerns, admin should manually check
- "reject": Photo is clearly fake/downloaded/manipulated`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this selfie photo for authenticity. Is this a real selfie or potentially fake/downloaded?"
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "low"
              }
            }
          ]
        }
      ],
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        isSuspicious: result.isSuspicious || false,
        confidence: result.confidence || 0,
        reasons: result.reasons || [],
        recommendation: result.recommendation || 'review'
      };
    }

    return {
      isSuspicious: false,
      confidence: 0,
      reasons: ['Could not analyze photo'],
      recommendation: 'review'
    };
  } catch (error) {
    console.error('Photo verification error:', error);
    return {
      isSuspicious: false,
      confidence: 0,
      reasons: ['Verification service unavailable'],
      recommendation: 'review'
    };
  }
}
