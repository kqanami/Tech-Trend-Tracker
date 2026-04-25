import { LucideIcon, SearchX, Database, Star, TrendingUp, FileX } from 'lucide-react'
import { motion } from 'framer-motion'

interface EmptyStateProps {
    icon?: LucideIcon
    title: string
    description?: string
    action?: {
        label: string
        onClick: () => void
    }
}

export default function EmptyState({ icon: Icon = SearchX, title, description, action }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-24 text-center space-y-6"
        >
            {/* Glowing icon */}
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150" />
                <div className="relative w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Icon className="w-10 h-10 text-indigo-400" strokeWidth={1.5} />
                </div>
            </div>

            {/* Text */}
            <div className="space-y-2 max-w-xs">
                <h3 className="text-xl font-bold text-white">{title}</h3>
                {description && (
                    <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                )}
            </div>

            {/* Optional action button */}
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-5 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 font-medium text-sm transition-all hover:scale-105"
                >
                    {action.label}
                </button>
            )}
        </motion.div>
    )
}

// Pre-configured empty state variants
export const NoArticles = ({ onReset }: { onReset?: () => void }) => (
    <EmptyState
        icon={FileX}
        title="Нет статей"
        description="По вашему запросу ничего не найдено. Попробуйте изменить фильтры."
        action={onReset ? { label: 'Сбросить фильтры', onClick: onReset } : undefined}
    />
)

export const NoResults = ({ onReset }: { onReset?: () => void }) => (
    <EmptyState
        icon={SearchX}
        title="Ничего не найдено"
        description="Попробуйте другой поисковый запрос или сбросьте фильтры."
        action={onReset ? { label: 'Сбросить', onClick: onReset } : undefined}
    />
)

export const NoData = () => (
    <EmptyState
        icon={Database}
        title="Данные загружаются"
        description="Сборщик данных ещё не наполнил базу. Запустите парсинг в Admin-панели."
    />
)

export const NoFavorites = () => (
    <EmptyState
        icon={Star}
        title="Нет избранного"
        description="Добавьте статьи или тренды в избранное, нажав на звёздочку."
    />
)

export const NoTrends = () => (
    <EmptyState
        icon={TrendingUp}
        title="Нет трендов"
        description="Тренды появятся после анализа собранных статей."
    />
)
