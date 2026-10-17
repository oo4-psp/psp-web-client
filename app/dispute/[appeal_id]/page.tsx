'use client';

import React, { useEffect, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react'

interface PageProps {
    params: Promise<{
        appeal_id: string;
    }>;
}

type DisputInfo = {
    appeal_id: string, 
    order_id: string, 
    status_code: number, 
    reject_reason: string, 
    reject_reason_text: string, 
    order_amount: number | null,
    new_amount: number | null,
    created_at: string,
    resolved_at: string | null,
    declined_at: string | null,
    files: DisputFile[] | null
};
type DisputFile = {
    file_name: string,
    url: string,
    uploaded_by: string | null
}

import { request } from '@/lib/api.ts';

export default function DisputViewPage({ params }: PageProps)
{
    const { appeal_id } = React.use(params);
    const [disputData, setDisputData] = useState(null);

    async function loadDisputInfo(id: string) 
    {
        try {
		    const disputData = await request(`/api/appeals/view/${id}`)
		    setDisputData(disputData.appeal ?? null)
	    } catch (e) {
			console.error('Failed to refresh orders', e)
		}
    }

    useEffect(() => {
        loadDisputInfo(appeal_id);
    }, []);

    useEffect(() => {
        console.log(disputData);
    }, [disputData]);

    return (
        <div>
            {!disputData ? (<h1>Loading</h1>) : (
                <div className="disput-card" style={{
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    maxWidth: "700px",
    margin: "20px auto",
    lineHeight: "1.6"
}}>
    <h2 style={{ marginBottom: "15px" }}>Диспут #{disputData.appeal_id}</h2>

    <div className="disput-section">
        <h3>Основна інформація</h3>
        <ul>
            <li><strong>Order ID:</strong> {disputData.order_id}</li>
            <li><strong>Статус:</strong> {disputData.status_code}</li>
            <li><strong>Причина відхилення:</strong> {disputData.reject_reason || "—"}</li>
            <li><strong>Опис причини:</strong> {disputData.reject_reason_text || "—"}</li>
        </ul>
    </div>

    <div className="disput-section">
        <h3>Суми</h3>
        <ul>
            <li><strong>Сума ордеру:</strong> {disputData.order_amount ?? "—"}</li>
            <li><strong>Нова сума диспуту:</strong> {disputData.new_amount ?? "—"}</li>
        </ul>
    </div>

    <div className="disput-section">
        <h3>Дати</h3>
        <ul>
            <li><strong>Створено:</strong> {disputData.created_at}</li>
            <li><strong>Вирішено:</strong> {disputData.resolved_at ?? "—"}</li>
            <li><strong>Відхилено:</strong> {disputData.declined_at ?? "—"}</li>
        </ul>
    </div>

    <div className="disput-section">
        <h3>Файли</h3>
        {(!disputData.files || disputData.files.length === 0) ? (
            <p>Файлів немає</p>
        ) : (
            <ul>
                {disputData.files.map((file, i) => (
                    <li key={i} style={{ marginBottom: "8px" }}>
                        <a href={file.url} target="_blank" style={{ color: "#0070f3" }}>
                            {file.file_name}
                        </a>
                        <small style={{ marginLeft: "10px", opacity: 0.7 }}>
                            {file.uploaded_by ? `Завантажив: ${file.uploaded_by}` : ""}
                        </small>
                    </li>
                ))}
            </ul>
        )}
    </div>
</div>
            ) }
            
        </div>
    );
}