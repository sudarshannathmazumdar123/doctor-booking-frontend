"use client";
import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

const axiosApi = axios.create({
  //   baseURL: "https://doctor-booking-backend-vltm.onrender.com",
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "69420",
  },
});

axiosApi.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.log("error", error);

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = Cookies.get("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");
        Cookies.remove("token");
        const response = await axios.get(
          `http://localhost:8000/auth/get-access-token`,
          { headers: { Authorization: `Bearer ${refreshToken}` } }
        );
        const { token } = response.data;
        Cookies.set("token", token);

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        Cookies.remove("token");
        Cookies.remove("refreshToken");
        toast.error("Session expired, please login again");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosApi;
