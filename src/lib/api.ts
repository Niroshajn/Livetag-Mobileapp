import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔥 ADD THIS (VERY IMPORTANT)
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");

    console.log("TOKEN FROM STORAGE:", token); // 👈 add this

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("HEADERS:", config.headers); // 👈 add this

    return config;
  }
);

export default api;