import { generateChallenge, generateVerifier } from "../utils/pkce";
import axios from "axios";

const redirectUri = "https://a.myho.st:8888/check";
const clientId = "W4JkWYy4Qy1PogYmwOBt9I3HhQlzqD2m";
const oauth2SdkUrl = "https://auth.demo.eniblock.com";

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

        const authorizationUrl = `${oauth2SdkUrl}/authorize?client_id=${encodeURIComponent(
            clientId,
        )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(
            "openid profile email eniblock offline_access",
        )}&code_challenge=${encodeURIComponent(challenge)}&code_challenge_method=S256&audience=${encodeURIComponent(
            "https://eniblock-sdk-demo.eu.auth0.com/api/v2/",
        )}&state=${encodeURIComponent(state)}`;
        window.location.replace(authorizationUrl);
    }

    // Method to handle logout
    async logout(accessToken: string) {
        await axios.post(
            `${oauth2SdkUrl}/oauth/revoke`,
            {
                client_id: clientId,
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
                `${oauth2SdkUrl}/oauth/token`,
                {
                    client_id: clientId,
                    redirect_uri: redirectUri,
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
            .get(`${oauth2SdkUrl}/userinfo`, {
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
