import 'regenerator-runtime/runtime';
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Big from 'big.js';
import Form from './components/Form';
import SignIn from './components/SignIn';
import Messages from './components/Messages';
import CeramicClient from '@ceramicnetwork/http-client'
import { IDX } from '@ceramicstudio/idx'
import { Avatar } from '@material-ui/core'
import { Grid } from '@material-ui/core'

const SUGGESTED_DONATION = '0';
const BOATLOAD_OF_GAS = Big(3).times(10 ** 13).toFixed();

const App = ({ contract, currentUser, nearConfig, wallet, didContract }) => {
  const [messages, setMessages] = useState([]);
  const [avatar, setAvatar] = useState('')

  useEffect(() => {
    // TODO: don't just fetch once; subscribe!
    contract.getMessages().then(setMessages);

    async function fetchData() {
        
      // 1. We check to ensure the NEAR account has a DID in the DID Registry on NEAR
      let didExists = await didContract.hasDID({accountId: currentUser.accountId})

      // 2. Knowing it exists, we then retrieve it and all the available definitions
      if(didExists){
        let did = await didContract.getDID({accountId: currentUser.accountId})
        let definitions = await didContract.getDefinitions()
       
        // 3. We need to build the profile alias from the definition based on how it's stored
        // in the DID Registry.  
        let m = 0
        let profileAlias
        while (m < definitions.length) {
          let key = definitions[m].split(':')
          if (key[0] == currentUser.accountId && key[1] == 'profile'){
            profileAlias = {'profile': key[2]}
          break
          }
          m++
        }
       
        // 4. We instantiate a ceramicClient and use it and the profile alias to instantiate
        // a new IDX.  That's what let's us get to the data record defined by the profile
        // definition.
        const API_URL = 'https://ceramic-clay.3boxlabs.com'
        const ceramicClient = new CeramicClient(API_URL, {docSyncEnabled: true})
        let userIdx = new IDX({ ceramic: ceramicClient, aliases: profileAlias})
        let result = await userIdx.get('profile', did)
        console.log('result', result)
        // 5.  Finally, if there is a data record in the profile for the DID, we set it
        // to some state variables so we can use them in the app wherever we like. Have
        // commented out all the profile fields except avatar for this example.       
        if(result) {
          //  result.date ? setDate(result.date) : setDate('')
            result.avatar ? setAvatar(result.avatar) : setAvatar('')
          //  result.shortBio ? setShortBio(result.shortBio) : setShortBio('')
          //  result.name ? setName(result.name) : setName('')
        }
      }
    }

    fetchData()
      .then((res) => {

      })

  }, []);

  const onSubmit = (e) => {
    e.preventDefault();

    const { fieldset, message, donation } = e.target.elements;

    fieldset.disabled = true;

    // TODO: optimistically update page with new message,
    // update blockchain data in background
    // add uuid to each message, so we know which one is already known
    contract.addMessage(
      { text: message.value },
      BOATLOAD_OF_GAS,
      Big(donation.value || '0').times(10 ** 24).toFixed()
    ).then(() => {
      contract.getMessages().then(messages => {
        setMessages(messages);
        message.value = '';
        donation.value = SUGGESTED_DONATION;
        fieldset.disabled = false;
        message.focus();
      });
    });
  };

  const signIn = () => {
    wallet.requestSignIn(
      nearConfig.contractName,
      'NEAR Guest Book'
    );
  };

  const signOut = () => {
    wallet.signOut();
    window.location.replace(window.location.origin + window.location.pathname);
  };

  return (
    <main>
      <header>
        <h1>NEAR Guest Book</h1>
        { currentUser
          ? <Grid container><Avatar src={avatar} style={{marginRight: '10px'}}/> <button onClick={signOut}>Log out</button></Grid>
          : <button onClick={signIn}>Log in</button>
        }
      </header>
      { currentUser
        ? <Form onSubmit={onSubmit} currentUser={currentUser} />
        : <SignIn/>
      }
      { !!currentUser && !!messages.length && <Messages messages={messages}/> }
    </main>
  );
};

App.propTypes = {
  contract: PropTypes.shape({
    addMessage: PropTypes.func.isRequired,
    getMessages: PropTypes.func.isRequired
  }).isRequired,
  currentUser: PropTypes.shape({
    accountId: PropTypes.string.isRequired,
    balance: PropTypes.string.isRequired
  }),
  nearConfig: PropTypes.shape({
    contractName: PropTypes.string.isRequired
  }).isRequired,
  wallet: PropTypes.shape({
    requestSignIn: PropTypes.func.isRequired,
    signOut: PropTypes.func.isRequired
  }).isRequired
};

export default App;
