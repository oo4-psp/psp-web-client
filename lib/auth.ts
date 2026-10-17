import { request } from '@/lib/api.ts';


export async function getCurrentUser()
{
    try {
        const data = request('/api/auth/me', { method: 'POST' });
        return data.user;
    } 
    catch(e)
    {
        console.error(e);
        return null;
    }
}