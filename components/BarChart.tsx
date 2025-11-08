import React from 'react';

interface BarChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      color: string;
    }[];
  };
}

const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const maxValue = Math.max(1, ...data.datasets.flatMap(ds => ds.data));
  const yAxisLabels = [0, maxValue * 0.25, maxValue * 0.5, maxValue * 0.75, maxValue].map(v => Math.ceil(v));

  return (
    <div className="w-full h-72 flex flex-col">
      {/* Y-Axis and Chart Area */}
      <div className="flex-grow flex">
        {/* Y-Axis Labels */}
        <div className="flex flex-col justify-between text-xs text-gray-400 ps-4">
          {yAxisLabels.reverse().map((label, index) => (
            <span key={index}>{label.toLocaleString()}</span>
          ))}
        </div>
        
        {/* Chart Bars */}
        <div className="flex-grow grid grid-cols-1">
          <div className="relative grid grid-cols-6 gap-4 h-full">
            {/* Grid Lines */}
            {yAxisLabels.map((_, index) => (
                <div key={index} className="col-span-6 border-t border-dashed border-gray-200 absolute w-full" style={{ bottom: `${(index / (yAxisLabels.length - 1)) * 100}%`}}></div>
            ))}
            {/* Bars */}
            {data.labels.map((label, index) => (
              <div key={label} className="flex justify-around items-end h-full pt-4">
                {data.datasets.map((dataset, dsIndex) => (
                  <div 
                    key={dsIndex}
                    className="w-1/3 rounded-t-md animate-bar-grow transform-origin-bottom"
                    style={{ 
                      height: `${(dataset.data[index] / maxValue) * 100}%`,
                      backgroundColor: dataset.color,
                      animationDelay: `${index * 100}ms`
                    }}
                    title={`${dataset.label}: ${dataset.data[index].toLocaleString()}`}
                  ></div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* X-Axis Labels */}
      <div className="flex justify-around items-center pt-2 text-xs text-gray-500 ms-[5%]">
        {data.labels.map(label => (
          <span key={label} className="w-1/6 text-center">{label}</span>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-6 pt-4 text-sm">
        {data.datasets.map((dataset) => (
          <div key={dataset.label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: dataset.color }}></span>
            <span>{dataset.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarChart;
