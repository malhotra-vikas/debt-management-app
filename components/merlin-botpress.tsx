import { Webchat, WebchatProvider, useClient } from '@botpress/webchat';

import './../styles/merlin.css';

import { theme } from '../styles/merlin-theme'

const clientId = '7fc1134d-1055-4873-b661-260daace7d1f';

export default function Merlin() {
    const client = useClient({ clientId });

    return (
        <WebchatProvider client={client} theme={theme}>
            <Webchat />
        </WebchatProvider>
    );
}
