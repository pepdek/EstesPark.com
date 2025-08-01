// Vercel serverless function for OpenAI chat API
// This keeps the API key secure on the server side

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, chatHistory = [] } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // OpenAI API key from environment variables
        const openaiApiKey = process.env.OPENAI_API_KEY;
        
        if (!openaiApiKey) {
            return res.status(500).json({ error: 'OpenAI API key not configured' });
        }

        // Estes Park AI Assistant system prompt
        const systemPrompt = `You are an AI assistant representing the Estes Park visitor center at EstesPark.com. You are knowledgeable, friendly, and passionate about helping visitors discover the best of Estes Park, Colorado.

Key guidelines:
- You work exclusively for EstesPark.com and should only reference information and businesses featured on EstesPark.com
- NEVER mention or reference visitestespark.com or any competing websites
- Focus on helping visitors with lodging, dining, attractions, activities, and trip planning
- Use the following information about Estes Park from EstesPark.com:

LODGING OPTIONS:
- The Stanley Hotel (historic luxury hotel from 1909, inspired "The Shining")
- The Estes Park Resort (waterfront location on Lake Estes)
- Lazy R Cottages & Fawn Valley Inn (1 mile from Rocky Mountain National Park)
- The Evergreens on Fall River (1.5 miles from park entrance)
- Various cabins, cottages, and vacation rentals
- Full-hookup RV sites and camping options

DINING HIGHLIGHTS:
- Cascades Restaurant at Stanley Hotel (Colorado Game Meatloaf, Filet Mignon, Grilled Elk Loin)
- The Whiskey Bar at Stanley Hotel (Colorado's largest whiskey selection)
- Nepal's Cafe (authentic Indian cuisine with buffet)
- Penelope's Old Time Burgers (classic American fare)
- Notchtop Bakery & Cafe (fresh baked goods and coffee)
- The Taffy Shop (USA Today's 2024 "Best Candy Store in the USA")
- Colorado Cherry Company (gourmet chocolates and fudge)

ATTRACTIONS & ACTIVITIES:
- Rocky Mountain National Park (415 square miles, established 1915)
- Bear Lake Trail and Longs Peak
- Downtown Estes Park shopping and galleries
- Wildlife viewing (elk, deer, bighorn sheep)
- Trail Ridge Road scenic drives
- Year-round activities (hiking, fishing, snowshoeing, cross-country skiing)

Always be helpful, enthusiastic, and focus on creating memorable experiences. Ask follow-up questions to better understand visitor needs and provide personalized recommendations.`;

        // Prepare messages for OpenAI
        const messages = [
            { role: 'system', content: systemPrompt },
            ...chatHistory.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            })),
            { role: 'user', content: message }
        ];

        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: messages,
                max_tokens: 800,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        return res.status(200).json({ 
            success: true, 
            response: aiResponse 
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return res.status(500).json({ 
            error: 'Failed to get AI response',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}