import { LucideIcon } from 'lucide-react';

interface ComparisonValue {
  value: string | number;
  label: string;
  color: string; // e.g., 'bg-purple-500'
  textColor?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  comparisonValues?: ComparisonValue[]; // New prop for split view
}

export const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = "blue", comparisonValues }: StatCardProps) => {
  const colorClasses: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    green: "text-green-600 bg-green-50 border-green-100",
    purple: "text-purple-600 bg-purple-50 border-purple-100",
    orange: "text-orange-600 bg-orange-50 border-orange-100",
    red: "text-red-600 bg-red-50 border-red-100",
  };

  const selectedColor = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-full transition-all hover:shadow-md group relative">
      <div className="flex justify-between items-start mb-4">
        <span className="text-gray-500 text-sm font-medium">{title}</span>
        <div className={`p-2 rounded-lg ${selectedColor.split(' ')[1]} ${selectedColor.split(' ')[0]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {comparisonValues ? (
        <div className="flex items-center w-full h-12 mt-1">
          {comparisonValues.map((item, index) => (
            <div
              key={index}
              className={`flex-1 h-full flex items-center justify-center relative group/tooltip ${item.color} transition-all hover:opacity-90 
                ${index === 0 ? 'rounded-l-lg' : ''} 
                ${index === comparisonValues.length - 1 ? 'rounded-r-lg' : ''}
              `}
            >
              <span className={`text-xl font-bold ${item.textColor || 'text-white'}`}>{item.value}</span>

              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1.5 px-3 rounded shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {item.label}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-end justify-between">
          <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
          {trend && (
            <div className={`flex items-center text-sm font-medium ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400'
              }`}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              <span className="ml-1">{trendValue}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
