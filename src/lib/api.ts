// import axios from "axios";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { API_URL } from "@env";

// console.log("ENV API_URL:", API_URL);
// const api = axios.create({
//   baseURL: API_URL,
//   timeout: 10000,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// api.interceptors.request.use(
//   async (config) => {
//     const token = await AsyncStorage.getItem("token");

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     console.log("\n========== API REQUEST ==========");
//     console.log("METHOD:", config.method?.toUpperCase());
//     console.log("BASE URL:", config.baseURL);
//     console.log("URL:", config.url);
//     console.log(
//       "FULL URL:",
//       `${config.baseURL}${config.url}`
//     );
//     console.log("PARAMS:", config.params);
//     console.log("BODY:", config.data);
//     console.log("TOKEN:", token ? "Present" : "Missing");
//     console.log("HEADERS:", config.headers);
//     console.log("=================================\n");

//     return config;
//   },
//   (error) => {
//     console.log("REQUEST ERROR:", error);
//     return Promise.reject(error);
//   }
// );

// api.interceptors.response.use(
//   (response) => {
//     console.log("\n========== API RESPONSE ==========");
//     console.log("STATUS:", response.status);
//     console.log("URL:", response.config.url);
//     console.log("METHOD:", response.config.method?.toUpperCase());
//     console.log("RESPONSE:", response.data);
//     console.log("==================================\n");

//     return response;
//   },
//   (error) => {
//     console.log("\n========== API ERROR ==========");

//     if (error.response) {
//       console.log("STATUS:", error.response.status);
//       console.log("URL:", error.config?.url);
//       console.log("METHOD:", error.config?.method?.toUpperCase());
//       console.log("ERROR RESPONSE:", error.response.data);
//       console.log("ERROR HEADERS:", error.response.headers);
//     } else if (error.request) {
//       console.log("REQUEST SENT BUT NO RESPONSE");
//       console.log("URL:", error.config?.url);
//     } else {
//       console.log("ERROR:", error.message);
//     }

//     console.log("================================\n");

//     return Promise.reject(error);
//   }
// );

// export default api;


import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";

console.log("========== ENV CHECK ==========");
console.log("API_URL:", JSON.stringify(API_URL));
console.log("================================");

if (!API_URL) {
  throw new Error("API_URL is missing. Check your .env configuration.");
}

const api = axios.create({
  baseURL: API_URL.trim(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("\n========== API REQUEST ==========");
    console.log("METHOD:", config.method?.toUpperCase());
    console.log("BASE URL:", config.baseURL);
    console.log("URL:", config.url);
    console.log("FULL URL:", `${config.baseURL}${config.url}`);
    console.log("TOKEN:", token ? "Present" : "Missing");
    console.log("=================================\n");

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log("API RESPONSE:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log("API ERROR:", error.message);

    if (error.response) {
      console.log("STATUS:", error.response.status);
      console.log("ERROR RESPONSE:", error.response.data);
    } else if (error.request) {
      console.log("REQUEST SENT BUT NO RESPONSE");
      console.log("URL:", error.config?.url);
    }

    return Promise.reject(error);
  }
);

export default api;
