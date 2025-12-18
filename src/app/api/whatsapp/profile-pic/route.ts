
import { NextResponse } from 'next/server';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME;

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }

    if (!EVOLUTION_API_URL || !EVOLUTION_INSTANCE_NAME || !EVOLUTION_API_KEY) {
       // Se não tiver config, retorna null sem erro para não quebrar a UI
       return NextResponse.json({ url: null });
    }

    // Evolution API: POST /chat/fetchProfilePictureUrl/{instance}
    // Body: { number: "..." }
    const url = `${EVOLUTION_API_URL}/chat/fetchProfilePictureUrl/${EVOLUTION_INSTANCE_NAME}`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({ number: phone })
    });

    if (!res.ok) {
      console.error('Error fetching profile pic:', await res.text());
      return NextResponse.json({ url: null });
    }

    const data = await res.json();
    // Evolution API typically returns { profilePictureUrl: "..." } or similar
    // Check payload structure. Usually it is data.pictureUrl or data.profilePictureUrl
    const pictureUrl = data.profilePictureUrl || data.pictureUrl || data.url || null;

    return NextResponse.json({ url: pictureUrl });

  } catch (error) {
    console.error('Profile pic error:', error);
    return NextResponse.json({ url: null });
  }
}
