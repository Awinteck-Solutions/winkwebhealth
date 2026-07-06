import { BASEURL } from "../../constants/api.constant"


export const authEndpoints = {
    LOGIN: `${BASEURL}/auth/login`,
    REGISTER: `${BASEURL}/auth/signup`,
    FORGOT_PASSWORD: `${BASEURL}/auth/forgot-password`,
    RESET_PASSWORD: `${BASEURL}/auth/reset-password`,
    VALIDATE_RESET: (token) => `${BASEURL}/auth/reset-password/${token}`,
}