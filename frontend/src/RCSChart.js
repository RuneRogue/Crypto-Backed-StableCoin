import React, { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import Papa from "papaparse";

const RCSPriceChart = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = () => {
            fetch("/RCSPrice.csv")
                .then((response) => response.text())
                .then((csvData) => {
                    Papa.parse(csvData, {
                        header: true,
                        complete: (result) => {
                            const parsedData = result.data.map((row) => ({
                                price: parseFloat(row.price),
                                // Include any additional processing if needed
                            }));
                            const last20Data = parsedData.slice(-40);
                            setData(last20Data);
                        },
                    });
                });
        };

        fetchData();
        const interval = setInterval(fetchData, 60000); // Refetch CSV data every minute

        return () => clearInterval(interval); // Cleanup the interval on unmount
    }, []);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="label">{`Price: ${payload[0].value.toFixed(4)}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                    type="linear"
                    dataKey="price"
                    stroke="#000000"
                    dot={false}
                    strokeWidth={2}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default RCSPriceChart;
