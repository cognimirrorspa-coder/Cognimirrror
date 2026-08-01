import { Sparkles } from 'lucide-react';

interface InsightCardProps {
    insight: string;
    type?: 'positive' | 'neutral' | 'attention';
}

export const InsightCard = ({ insight, type = 'positive' }: InsightCardProps) => {
    const bgColors = {
        positive: 'bg-green-50 border-green-100',
        neutral: 'bg-blue-50 border-blue-100',
        attention: 'bg-amber-50 border-amber-100'
    };

    const textColors = {
        positive: 'text-green-800',
        neutral: 'text-blue-800',
        attention: 'text-amber-800'
    };

    return (
        <div className={`rounded-xl p-6 border ${bgColors[type]} h-full`}>
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className={`w-5 h-5 ${textColors[type]}`} />
                <h3 className={`font-bold ${textColors[type]}`}>Insight from Cognimirror</h3>
            </div>
            <p className={`text-sm leading-relaxed ${textColors[type]} opacity-90`}>
                {insight}
            </p>
        </div>
    );
};
