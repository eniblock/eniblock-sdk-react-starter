import React, {CSSProperties, useEffect} from 'react';
import {ClipLoader} from "react-spinners";
import authService from "../../services/auth-service";
import {useNavigate} from "react-router-dom";

const override: CSSProperties = {
    display: "block",
    margin: "0 auto",
    borderColor: "red",
};

function CheckComponent(): React.JSX.Element {

    const navigate = useNavigate();

    useEffect(() => {
        authService.receiveCode().then(() => {
            console.log('Code receive');
            return navigate('/', {
                state: {
                    accessToken: localStorage.getItem('starter_sdk_react_access_token')
                }
            });
        }).catch((error) => {
            console.error('Code not received:', error);
        });
    });

    return (
        <div className="sweet-loading">
            <ClipLoader
                color={"#ffffff"}
                loading={true}
                cssOverride={override}
                size={150}
                aria-label="Loading Spinner"
                data-testid="loader"
            />
        </div>);
}

export default CheckComponent;
