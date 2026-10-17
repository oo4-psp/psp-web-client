const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

export async function request(path: string, options: RequestInit = {}) {
    const response = await fetch(`${API}${path}`, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) } })
    if (!response.ok) 
        throw new Error(await response.text())
    return response.status === 204 ? null : response.json()
}