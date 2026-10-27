import { request } from '@/lib/api.ts';


export async function getCurrentUser()
{
    try {
        const data = await request<{ user: unknown }>('/api/auth/me', { method: 'POST' });
        return data.user;
    } 
    catch(e)
    {
        console.error(e);
        return null;
    }
}
