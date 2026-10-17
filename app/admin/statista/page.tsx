async function getUnprocessedOrdersData()
{
    try {
        const res = await fetch("https://api.example.com/users");

        if (!res.ok) {
            throw new Error("Failed to fetch users");
        }

        return res.json();
    } catch (error) {
        console.error('Failed getUnprocessedOrdersData', error)
    }
}

export default async function Admin_StatistaViewPage()
{
    const unprocessedOrdersData = await getUnprocessedOrdersData();

    return (
        <div>
            <h1>Admin statista</h1>
        </div>
    )
}