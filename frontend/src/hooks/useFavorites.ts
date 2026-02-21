import { useState, useEffect, useCallback } from 'react'

type FavoriteType = 'article' | 'trend' | 'repo'

interface Favorite {
    type: FavoriteType
    id: number
}

const STORAGE_KEY = 'tech_trend_favorites'

export function useFavorites() {
    const [favorites, setFavorites] = useState<Favorite[]>([])

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                setFavorites(JSON.parse(stored))
            } catch {
                setFavorites([])
            }
        }
    }, [])

    const saveFavorites = useCallback((newFavorites: Favorite[]) => {
        setFavorites(newFavorites)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites))
    }, [])

    const addFavorite = useCallback((type: FavoriteType, id: number) => {
        const favorite: Favorite = { type, id }
        setFavorites((prev) => {
            if (prev.some((f) => f.type === type && f.id === id)) {
                return prev
            }
            const updated = [...prev, favorite]
            saveFavorites(updated)
            return updated
        })
    }, [saveFavorites])

    const removeFavorite = useCallback((type: FavoriteType, id: number) => {
        setFavorites((prev) => {
            const updated = prev.filter((f) => !(f.type === type && f.id === id))
            saveFavorites(updated)
            return updated
        })
    }, [saveFavorites])

    const isFavorite = useCallback((type: FavoriteType, id: number) => {
        return favorites.some((f) => f.type === type && f.id === id)
    }, [favorites])

    const toggleFavorite = useCallback((type: FavoriteType, id: number) => {
        if (isFavorite(type, id)) {
            removeFavorite(type, id)
        } else {
            addFavorite(type, id)
        }
    }, [isFavorite, addFavorite, removeFavorite])

    const getFavoritesByType = useCallback((type: FavoriteType) => {
        return favorites.filter((f) => f.type === type).map((f) => f.id)
    }, [favorites])

    return {
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        toggleFavorite,
        getFavoritesByType,
    }
}

