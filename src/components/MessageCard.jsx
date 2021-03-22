import React, {useState, useEffect} from 'react'
import CeramicClient from '@ceramicnetwork/http-client'
import { IDX } from '@ceramicstudio/idx'
import Avatar from '@material-ui/core/Avatar'
import Grid from '@material-ui/core/Grid'

export default function MessageCard(props) {
const [avatar, setAvatar] = useState('')
const [name, setName] = useState('')

const {
    sender,
    text,
    premium,
    didContract,
} = props

useEffect(() => {

  async function fetchData() {
      
    // 1. We check to ensure the NEAR account has a DID in the DID Registry on NEAR
    let didExists = await didContract.hasDID({accountId: sender})

    // 2. Knowing it exists, we then retrieve it and all the available definitions
    if(didExists){
      let did = await didContract.getDID({accountId: sender})
      let definitions = await didContract.getDefinitions()
     
      // 3. We need to build the profile alias from the definition based on how it's stored
      // in the DID Registry.  
      let m = 0
      let profileAlias
      while (m < definitions.length) {
        let key = definitions[m].split(':')
        if (key[0] == sender && key[1] == 'profile'){
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
      
      // 5.  Finally, if there is a data record in the profile for the DID, we set it
      // to some state variables so we can use them in the app wherever we like. Have
      // commented out all the profile fields except avatar for this example.       
      if(result) {
        //  result.date ? setDate(result.date) : setDate('')
        result.avatar ? setAvatar(result.avatar) : setAvatar('')
        //  result.shortBio ? setShortBio(result.shortBio) : setShortBio('')
        result.name ? setName(result.name) : setName('')
      }
    }
  }

  fetchData()

}, []);

return (
    <Grid container justify="flex-start" alignItems="center">
    <Grid item xs={12}>
      <p className={premium ? 'is-premium' : ''}/>
    </Grid>
    <Grid item xs={1}>
    <Avatar src={avatar} />
    </Grid>
    <Grid item xs={11}>
      <strong>{name} ({sender})</strong>:<br/>
    </Grid>
    <Grid item  xs={12}>
      {text}
    </Grid>
   </Grid> 
)
}