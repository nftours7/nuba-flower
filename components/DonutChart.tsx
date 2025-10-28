import React, { useMemo } from 'react';
import { useApp } from '../hooks/useApp';

interface DonutChartProps {
    data: { label: string; value: number }[];
    centerLabel: string;
}

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

const DonutChart: React.FC<DonutChartProps> = ({ data, centerLabel }) => {
    const { t } = useApp();
    const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);
    
    if (total === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p>{t('noData')}</p>
            </div>
        )
    }

    let cumulativePercentage = 0;
    const gradients = data.map((item, index) => {
        const percentage = (item.value / total) * 100;
        const color = COLORS[index % COLORS.length];
        const gradient = `${color} ${cumulativePercentage}% ${cumulativePercentage + percentage}%`;
        cumulativePercentage += percentage;
        return gradient;
    }).join(', ');
    
    const sortedData = useMemo(() => [...data].sort((a,b) => b.value - a.value), [data]);

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div
                className="relative w-48 h-48 rounded-full animate-donut-spin"
                style={{
                    background: `conic-gradient(${gradients})`,
                }}
            >
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                    <div className="text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
                        <p className="text-3xl font-bold">{total.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">{centerLabel}</p>
                    </div>
                </div>
            </div>
            <div className="mt-6 w-full space-y-2 animate-fade-in" style={{ animationDelay: '0.7s' }}>
                {sortedData.slice(0, 5).map((item, index) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 truncate">
                            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                            <span className="text-gray-600 truncate" title={item.label}>{item.label}</span>
                        </div>
                        <span className="font-semibold">{item.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DonutChart;