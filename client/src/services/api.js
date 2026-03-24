import axios from 'axios'

//frontedn-ul comunica cu backend-ul in acest fisier
const api = axios.create({
    baseURL: 'http://localhost:7000/api'
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if(token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default api