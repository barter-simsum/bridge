import React, {
  createContext,
  forwardRef,
  useContext,
  useState,
  useEffect,
} from 'react';
import { Just, Maybe, Nothing } from 'purify-ts/Maybe';
import * as azimuth from 'azimuth-js';
import Web3 from 'web3';
import provider from 'web3';

import { CONTRACT_ADDRESSES } from '../lib/contracts';
import { NETWORK_TYPES, chainIdToNetworkType } from '../lib/network';
import { isDevelopment } from '../lib/flags';

import { Grid } from 'indigo-react';
import View from 'components/View';
import Blinky from 'components/Blinky';

function _useNetwork(initialNetworkType = null) {
  const [networkType, setNetworkType] = useState<Symbol | null>(
    initialNetworkType
  );

  const [metamask, setMetamask] = useState(false);
  const [web3, setWeb3] = useState<Maybe<Web3>>(Nothing);
  const [contracts, setContracts] = useState<Maybe<[]>>(Nothing);

  useEffect(() => {
    (async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.enable();
          setMetamask(true);
          setNetworkType(chainIdToNetworkType(window.ethereum.chainId));
        } catch (e) {
          console.log('Metamask denied');
        }
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      // given a web3 provider and contract addresses,
      // build the web3 and contracts objects
      const initWeb3 = async (provider: provider, contractAddresses) => {
        // use an in-window eth provider if possible
        const _provider = metamask ? window.ethereum : provider;
        const web3 = new Web3(_provider);

        let contracts = await azimuth.initContractsPartial(
          web3,
          contractAddresses.azimuth
        );
        contracts = azimuth.contracts.newLinearStarRelease(
          contracts,
          web3,
          contractAddresses.linearSR
        );
        contracts = azimuth.contracts.newConditionalStarRelease(
          contracts,
          web3,
          contractAddresses.conditionalSR
        );
        contracts = azimuth.contracts.newDelegatedSending(
          contracts,
          web3,
          contractAddresses.delegatedSending
        );

        setWeb3(Just(web3));
        setContracts(Just(contracts));
        return;
      };

      switch (networkType) {
        case NETWORK_TYPES.LOCAL: {
          const protocol = isDevelopment ? 'ws' : 'wss';
          const endpoint = `${protocol}://${document.location.hostname}:8545`;

          initWeb3(
            new Web3.providers.WebsocketProvider(endpoint),
            CONTRACT_ADDRESSES.DEV
          );
          return;
        }
        case NETWORK_TYPES.ROPSTEN: {
          const endpoint = `https://ropsten.infura.io/v3/${process.env.REACT_APP_INFURA_ENDPOINT}`;

          initWeb3(
            new Web3.providers.HttpProvider(endpoint),
            CONTRACT_ADDRESSES.ROPSTEN
          );
          return;
        }
        case NETWORK_TYPES.MAINNET: {
          const endpoint = `https://mainnet.infura.io/v3/${process.env.REACT_APP_INFURA_ENDPOINT}`;

          initWeb3(
            new Web3.providers.HttpProvider(endpoint),
            CONTRACT_ADDRESSES.MAINNET
          );
          return;
        }
        case NETWORK_TYPES.OFFLINE:
        default: {
          // NB (jtobin):
          //
          // The 'offline' network type targets the mainnet contracts, but does
          // not actually use a provider to connect.  We use a web3 instance to
          // initalise the contracts, but the network itself is set to Nothing.
          //
          // We may want to offer the ability to select a target network for
          // transactions when offline.

          // Note: example.com:3456 doesn't actually point to anything, we just
          // need a provider to initialize the Web3 object
          initWeb3(
            new Web3.providers.HttpProvider('http://example.com:3456'),
            isDevelopment ? CONTRACT_ADDRESSES.DEV : CONTRACT_ADDRESSES.MAINNET
          );
          setWeb3(Nothing);
          // ^ overwrite the web3 object from initWeb3 with a Nothing
          // to indicate that there is no valid web3 connection
          return;
        }
      }
    })();
  }, [networkType, metamask]);

  return { networkType, setNetworkType, web3, contracts };
}

const NetworkContext = createContext(null);

// provider
export function NetworkProvider({ initialNetworkType, children }) {
  const value = _useNetwork(initialNetworkType);

  if (value.contracts.isJust()) {
    return (
      <NetworkContext.Provider value={value}>
        {children}
      </NetworkContext.Provider>
    );
  } else {
    return (
      <View inset>
        <Grid>
          <Grid.Item full className="mt8 t-center">
            <Blinky /> Connecting...
          </Grid.Item>
        </Grid>
      </View>
    );
  }
}

// hook consumer
export function useNetwork() {
  return useContext(NetworkContext);
}

// hoc consumer
export const withNetwork = Component =>
  forwardRef((props, ref) => {
    return (
      <NetworkContext.Consumer>
        {value => <Component ref={ref} {...value} {...props} />}
      </NetworkContext.Consumer>
    );
  });
