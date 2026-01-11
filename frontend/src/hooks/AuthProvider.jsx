import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useMemo,
} from "react";
import {useNavigate} from "react-router-dom";
import {api, API_URL} from "../services/api";
import {jwtDecode} from "jwt-decode";
import {toast} from "react-toastify";

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem("user");
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const navigate = useNavigate();

    // Hàm xử lý khi có thay đổi storage từ các tab khác
    const handleStorageChange = useCallback(
        (event) => {
            if (event.key === "user") {
                if (event.newValue) {
                    try {
                        const newUser = JSON.parse(event.newValue);
                        setUser(newUser);
                    } catch (error) {
                        console.error("Failed to parse user data", error);
                    }
                } else {
                    // Nếu user bị xóa (logout từ tab khác)
                    setUser(null);
                    navigate("/");
                }
            }
        },
        [navigate]
    );

    useEffect(() => {
        // Thêm listener cho sự kiện storage
        window.addEventListener("storage", handleStorageChange);

        return () => {
            // Dọn dẹp listener khi component unmount
            window.removeEventListener("storage", handleStorageChange);
        };
    }, [handleStorageChange]);

    const loginWithGoogle = async () => {
        const width = 600;
        const height = 650;
        const left = (window.innerWidth - width) / 2 + window.screenX;
        const top = (window.innerHeight - height) / 2 + window.screenY;

        const popup = window.open(
            `${API_URL}/login/google`,
            "Google Login",
            `width=${width},height=${height},left=${left},top=${top}`
        );
        popup.document.close();

        try {
            const messageHandler = async (event) => {
                const originUrl = new URL(API_URL);
                if (event.origin !== originUrl.origin) {
                    throw new Error("Origin is invalid.")
                }

                const {access_token} = event.data;

                await fetchUser(access_token);
                return true;
            };

            window.addEventListener("message", messageHandler, false);

            const interval = setInterval(() => {
                if (popup.closed) {
                    clearInterval(interval);
                    window.removeEventListener("message", messageHandler);
                }
            }, 3000);
        } catch (error) {
            console.error("Login failed:", error.response?.data || error.message);
            throw new Error(error.response?.data?.detail || "Invalid credentials.");
        }
    };

    const login = async (username, password) => {
        try {
            const formData = new URLSearchParams();
            formData.append("grant_type", "password");
            formData.append("username", username);
            formData.append("password", password);
            formData.append("scope", "");
            formData.append("client_id", "string");
            formData.append("client_secret", "string");

            const response = await api.post("/login/access-token", formData);
            const {access_token} = response.data;

            await fetchUser(access_token);
        } catch (error) {
            console.error("Login failed:", error.response?.data || error.message);
            throw new Error(error.response?.data?.detail || "Invalid credentials.");
        }
    };

    const fetchUser = async (access_token) => {
        if (!access_token) throw new Error("No valid token received.");

        let decodedToken;
        try {
            decodedToken = jwtDecode(access_token);
        } catch (error) {
            console.error("Invalid token format:", error);
            throw new Error("Invalid token received.");
        }

        const userResponse = await api.get("users/me", {
            headers: {Authorization: `Bearer ${access_token}`},
        });

        if (!userResponse.data) throw new Error("Failed to fetch user data.");

        const userData = {
            accessToken: access_token,
            id: userResponse.data.id,
            email: userResponse.data.email,
            fullName: userResponse.data.full_name,
            isFirstLogin: userResponse.data.is_first_login,
            isChatbotCreator: userResponse.data.is_chatbot_creator,
            isAdmin: userResponse.data.is_admin,
            exp: decodedToken.exp,
        };

        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        // Redirect based on role
        if (userData.isFirstLogin) {
            navigate("/change-password", {replace: true});
        } else if (userData.isAdmin) {
            navigate("/admin/dashboard", {replace: true});
        } else if (userData.isChatbotCreator) {
            navigate("/workspace", {replace: true});
        } else {
            navigate("/user/workspace", {replace: true});
        }
    };

    const logout = useCallback(() => {
        // Xóa user khỏi localStorage - điều này sẽ kích hoạt sự kiện storage trên các tab khác
        localStorage.removeItem("user");
        setUser(null);
        navigate("/");
    }, [navigate]);

    const checkTokenExpiration = useCallback(() => {
        if (!user) return;

        try {
            const currentTime = Math.floor(Date.now() / 1000);
            if (user.exp < currentTime) {
                console.warn("Token expired, logging out...");
                logout();
            }
        } catch (error) {
            console.error("Invalid token:", error);
            logout();
        }
    }, [user, logout]);

    useEffect(() => {
        checkTokenExpiration();
        const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [checkTokenExpiration]);

    const authContextValue = useMemo(
        () => ({user, login, logout, loginWithGoogle}),
        [user, login, logout, loginWithGoogle]
    );

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);