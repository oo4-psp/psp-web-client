const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

type ApiRequestOptions = RequestInit & { signal?: AbortSignal }

export async function request<T = unknown>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const response = await fetch(`${API}${path}`, {
        ...options,
        credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    })

    if (!response.ok) {
        const message = await response.text()
        throw new Error(message || `Request failed with status ${response.status}`)
    }

    return response.status === 204 ? (null as T) : response.json() as Promise<T>
}
