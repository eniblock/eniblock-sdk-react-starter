import React, {useEffect, useState} from 'react';
import logo from './logo.svg';
import './App.css';
import authService from "./services/auth-service";
import {Eniblock, UnsafeStorage} from "@eniblock/sdk";
import {useLocation} from "react-router-dom";

function App(): React.JSX.Element {

    const [publicKey, setPublicKey] = useState<string>('');
    const [address, setAddress] = useState<string>('');
    const [sdk, setSdk] = useState<Eniblock>();
    const [accessToken, setAccessToken] = useState('');
    const location = useLocation();
    const accessTokenFromLocation = location?.state?.accessToken ?? '';

    const handleLoginClick = () => {
        setTimeout(() => console.log('Log in progress'), 2000);
        authService.login();
    }

    const logout = async () => {
        // delete the TSS Wallet share and clear local storage
        await sdk!.wallet.destroy();
        console.warn('Your local Eniblock SDK Wallet is destroyed.');
        setAccessToken('');
        setPublicKey('');
        setAddress('');
        setSdk(undefined);
        await authService.logout(localStorage.getItem('starter_sdk_react_access_token') ?? '');
    }

    useEffect(() => {
        if (accessTokenFromLocation) {
            setAccessToken(accessTokenFromLocation);
        }
    }, [accessTokenFromLocation]);

    useEffect(() => {
        if (accessToken) {
            const fetchSdk = async () => {
                if (authService.isLoggedIn()) {
                    setSdk(new Eniblock({
                        appId: 'eniblock-demo',
                        accessTokenProvider: (() => Promise.resolve(localStorage.getItem('starter_sdk_react_access_token') ?? '')),
                        storage: new UnsafeStorage(),
                    }));
                }
            }

            fetchSdk().then(() => {
                console.log('Fetch sdk');
            }).catch(reason => console.error(reason));
        }
    }, [accessToken]);

    useEffect(() => {
        if (sdk) {
            const fetchAccount = async () => {
                if (!localStorage.getItem(`share-${sdk.appId}-ECDSA`)) {
                    await sdk.wallet.destroy();
                }
                const wallet = await sdk.wallet.instantiate();
                const account = await wallet.account.instantiate('My first account');
                const publicKeyFromAccount = await account.getPublicKey();
                setPublicKey(publicKeyFromAccount);

                const addressFromAccount = await account.getAddress();
                setAddress(addressFromAccount);

                return {wallet, account, publicKeyFromAccount, addressFromAccount}
            }

            fetchAccount().then(walletAndAccount => {
                console.log('Wallet and account:', walletAndAccount);
            }).catch(reason => console.error(reason));
        }
    }, [sdk]);

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo"/>
                <p>
                    Edit <code>src/App.tsx</code> and save to reload.
                </p>
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Learn React
                </a>
                {publicKey &&
                    <>
                        <div>Logged in !
                            <p>Your wallet and your account are instantiated<br/></p>
                            <p>Your public key : {publicKey}<br/></p>
                            <p>Your address : {address}<br/></p>
                            <p>You can check your console to see the detail of these objects.</p>
                        </div>
                        <div>
                            <button onClick={logout}>Logout</button>
                        </div>
                    </>
                }
                {!publicKey &&
                    <>
                        <button onClick={handleLoginClick}>Login to create a wallet</button>
                    </>
                }
            </header>
        </div>
    );
}

export default App;
