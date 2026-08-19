import { useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function useEmailEvents(onUpdate: (emailId: string, status: string) => void) {
  useEffect(() => {
    const source = new EventSource(`${API_URL}/api/events`);
    source.addEventListener('email-updated', (e) => {
      const { emailId, status } = JSON.parse((e as MessageEvent).data);
      onUpdate(emailId, status);
    });
    return () => source.close();
  }, [onUpdate]);
}
