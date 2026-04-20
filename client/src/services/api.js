import axios from 'axios'

//frontedn-ul comunica cu backend-ul in acest fisier
const api = axios.create({
    baseURL: 'https://sweetgoapp.onrender.com/api'
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if(token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default api