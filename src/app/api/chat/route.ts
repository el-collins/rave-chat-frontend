import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // headers for the OUTGOING request to n8n
    const n8nHeaders: Record<string, string> = {};
    let body: any;

    if (contentType.includes('application/json')) {
        body = JSON.stringify(await request.json());
        n8nHeaders['Content-Type'] = 'application/json';
    } else if (contentType.includes('multipart/form-data')) {
        // Handle File Uploads (STT/ITT)
        const formData = await request.formData();
        
        // Construct a new FormData to send to n8n
        // Note: In Node.js environment, we rely on the native fetch to handle boundary
        const outgoingFormData = new FormData();
        
        const file = formData.get('file');
        const message = formData.get('message');
        const sessionId = formData.get('sessionId');

        if (file) outgoingFormData.append('file', file);
        if (message) outgoingFormData.append('message', message);
        if (sessionId) outgoingFormData.append('sessionId', sessionId);
        
        body = outgoingFormData;
        // Do NOT set Content-Type header for multipart/form-data manually, fetch does it.
    } else {
        return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 400 });
    }

    const response = await fetch(config.n8nWebhookUrl, {
      method: 'POST',
      headers: n8nHeaders,
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Backend Error', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
