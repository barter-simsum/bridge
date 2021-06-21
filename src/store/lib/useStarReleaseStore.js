import { useState, useCallback } from 'react';
import { Nothing, Just } from 'purify-ts/Maybe';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import {
  generateWithdrawTxs,
  getLinear,
  getConditional,
  getLockupKind,
} from 'lib/starRelease';

export default function useStarRelease() {
  const { contracts } = useNetwork();
  const { wallet } = useWallet();

  const [starReleaseDetails, _setDetails] = useState(Nothing);

  const [batchLimits, setBatchLimits] = useState([]);

  const syncStarReleaseDetails = useCallback(async () => {
    const _wallet = wallet.orDefault(null);
    const _contracts = contracts.orDefault(null);
    if (!(_contracts && _wallet)) {
      return;
    }
    _setDetails(Nothing);

    const address = _wallet.address;

    try {
      const [linear, conditional, kind] = await Promise.all([
        getLinear(_contracts, address),
        getConditional(_contracts, address),
        getLockupKind(_contracts, address),
      ]);

      const keys = Object.keys(linear);
      const result = keys.reduce(
        (acc, key) => ({ ...acc, [key]: linear[key] + conditional[key] }),
        {}
      );
      result.kind = kind;
      result.linear = { approvedTransferTo: linear.approvedTransferTo };
      result.conditional = {
        approvedTransferTo: conditional.approvedTransferTo,
      };
      setBatchLimits(conditional.batchLimits);

      _setDetails(Just(result));
    } catch (e) {
      _setDetails(Nothing);
      console.error(e);
    }
  }, [contracts, wallet]);

  const withdraw = useCallback(
    (amount, to) => {
      const _wallet = wallet.orDefault(null);
      const _contracts = contracts.orDefault(null);
      if (!(_contracts && _wallet)) {
        return [];
      }
      return generateWithdrawTxs(_contracts, batchLimits, amount, to);
    },
    [batchLimits, contracts, wallet]
  );

  return { starReleaseDetails, syncStarReleaseDetails, withdraw };
}
