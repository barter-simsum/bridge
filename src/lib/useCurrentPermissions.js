import usePermissionsForPoint from './usePermissionsForPoint';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';

export default function useCurrentPermissions() {
  const { wallet } = useWallet();
  const { pointCursor } = usePointCursor();

  const _address = wallet.caseOf({
    Nothing: () => '',
    Just: p => p.value.address,
  });

  const _point = pointCursor.orDefault(null);

  return usePermissionsForPoint(_address, _point);
}
