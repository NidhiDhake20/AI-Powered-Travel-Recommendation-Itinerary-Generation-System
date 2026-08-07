import axios from 'axios'
import { getToken } from './authService'

const GATEWAY = import.meta.env.VITE_GATEWAY_URL

axios.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const getRecommendations = async (filters) =>
  (await axios.post(`${GATEWAY}/api/recommend`, filters)).data

export const getItinerary = async (destination, filters, language = 'en') =>
  (await axios.post(`${GATEWAY}/api/itinerary`, {
    destination:  destination.name,
    state:        destination.state,
    type:         destination.type,
    trip_id:      destination.trip_id,
    image_url:    destination.image_url,
    ml_score:     destination.ml_score,
    api_score:    destination.api_score,
    final_score:  destination.final_score,
    ...filters,
    language,
  })).data

export const saveTrip = async (tripData) =>
  (await axios.post(`${GATEWAY}/api/trips/save`, tripData)).data

export const getSavedTrips = async () =>
  (await axios.get(`${GATEWAY}/api/trips/saved`)).data

export const addExpense = async (data) =>
  (await axios.post(`${GATEWAY}/api/budget/add`, data)).data

export const getExpenses = async (tripId) =>
  (await axios.get(`${GATEWAY}/api/budget/${tripId}`)).data

export const deleteExpenseAPI = async (expenseId) =>
  (await axios.post(`${GATEWAY}/api/budget/delete`, { expense_id: expenseId })).data

export const sendChatMessage = async (message, tripContext, language = 'en') =>
  (await axios.post(`${GATEWAY}/api/chat`, { message, trip_context: tripContext, language })).data