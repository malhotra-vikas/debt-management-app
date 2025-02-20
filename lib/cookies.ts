import Cookies from 'js-cookie'

export interface UserProgress {
    userId: string
    lastQuestionId: string
}

export const COOKIE_NAME = 'user_progress'

export function saveProgress(userId: string, lastQuestionId: string) {
    const progress: UserProgress = {
        userId,
        lastQuestionId
    }
    Cookies.set(COOKIE_NAME, JSON.stringify(progress), { expires: 90 })
}

export function getProgress(): UserProgress | null {
    const progress = Cookies.get(COOKIE_NAME)
    if (progress) {
        try {
            return JSON.parse(progress)
        } catch (e) {
            console.error('Error parsing progress cookie:', e)
            return null
        }
    }
    return null
}
