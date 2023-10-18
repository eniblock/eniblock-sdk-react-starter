import { generateChallenge, generateVerifier } from "../utils/pkce";
import axios from "axios";

const OAUTH2_ALLOWED_CALLBACK_URL = "https://a.myho.st:8888/check";
const OAUTH2_CLIENTID = "W4JkWYy4Qy1PogYmwOBt9I3HhQlzqD2m"; // gitleaks:allow
const OAUTH2_DOMAIN = "https://eniblock-sdk-demo.eu.auth0.com";

class AuthService {
    // Method to initiate login process
    login() {
        const verifier = generateVerifier();
        const challenge = generateChallenge(verifier);
        const state = generateVerifier();

        // Save the verifier, challenge and state in local storage for later use
        localStorage.setItem("starter_sdk_react_pkce_verifier", verifier);
        localStorage.setItem("starter_sdk_react_pkce_state", state);
        localStorage.setItem("starter_sdk_react_pkce_challenge", challenge);

        const queryParameters = {
            client_id: OAUTH2_CLIENTID,
            redirect_uri: OAUTH2_ALLOWED_CALLBACK_URL,
            response_type: "code",
            scope: "openid profile email eniblock offline_access",
            code_challenge: challenge,
            code_challenge_method: "S256",
            audience: `${OAUTH2_DOMAIN}/api/v2/`,
            state: state,
        };

        const encodedParameters = Object.entries(queryParameters)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join("&");

        const authorizationUrl = `${OAUTH2_DOMAIN}/authorize?${encodedParameters}`;

        window.location.replace(authorizationUrl);
    }

    // Method to handle logout
    async logout(accessToken: string) {
        await axios.post(
            `${OAUTH2_DOMAIN}/oauth/revoke`,
            {
                client_id: OAUTH2_CLIENTID,
                token: accessToken,
            },
            {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            },
        );
        console.log("You are logout from the identity provider");

        localStorage.clear();
    }

    // Method to handle receiving the authorization code from the callback URL
    async receiveCode() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");
        const savedState = localStorage.getItem("starter_sdk_react_pkce_state");
        const verifier = localStorage.getItem("starter_sdk_react_pkce_verifier");
        const challenge = localStorage.getItem("starter_sdk_react_pkce_challenge");
        localStorage.setItem("starter_sdk_react_pkce_code", code ?? "");

        if (code && verifier && challenge && state === savedState) {
            await this.getTokens();
        } else {
            throw new Error("Invalid state or missing authorization code");
        }
    }

    // Method to exchange authorization code for access token
    private async getTokens() {
        try {
            const tokenResponse = await axios.post(
                `${OAUTH2_DOMAIN}/oauth/token`,
                {
                    client_id: OAUTH2_CLIENTID,
                    redirect_uri: OAUTH2_ALLOWED_CALLBACK_URL,
                    grant_type: "authorization_code",
                    code_verifier: localStorage.getItem("starter_sdk_react_pkce_verifier"),
                    code: localStorage.getItem("starter_sdk_react_pkce_code"),
                },
                {
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                },
            );

            console.log(tokenResponse);

            const accessToken = tokenResponse.data.access_token;
            const idToken = tokenResponse.data.id_token;
            localStorage.setItem("starter_sdk_react_access_token", accessToken);
            localStorage.setItem("starter_sdk_react_id_token", idToken);

            // Clear the verifier and state from session storage
            localStorage.removeItem("starter_sdk_react_pkce_verifier");
            localStorage.removeItem("starter_sdk_react_pkce_state");

            // Get user info
            this.getUserInfo(accessToken);
            return accessToken;
        } catch (error) {
            console.error("Error fetching access token:", error);
        }
    }

    // Method to fetch user information using the access token
    getUserInfo(accessToken: string) {
        axios
            .get(`${OAUTH2_DOMAIN}/userinfo`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            })
            .then((response) => console.log("User info: ", response.data))
            .catch((error) => console.error("Error fetching user information:", error));
    }

    isLoggedIn(): boolean {
        return !!localStorage.getItem("starter_sdk_react_access_token");
    }
}

const authService = new AuthService();

export default authService;
