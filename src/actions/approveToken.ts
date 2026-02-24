import type { Address, PublicClient, WalletClient } from 'viem';
import { erc20Abi } from 'viem';
import { confirm, fmtTokenSymbol, getTokenSymbol, throwErr } from '../utils/misc';

type ApproveTokenParams = {
    token: Address;
    rawAmount: bigint;
    spender: Address;
};

type ApprovalResult = 'NOT_ENOUGH_BALANCE' | 'ALREADY_APPROVED' | 'SUCCESS' | 'CANCELLED';

export async function approveToken(
    clients: { public: PublicClient; wallet: WalletClient },
    params: ApproveTokenParams,
): Promise<ApprovalResult> {
    const walletAddr = (await clients.wallet.getAddresses())[0] ?? throwErr('No address found');

    const [balance, allowance] = await Promise.all([
        clients.public.readContract({
            abi: erc20Abi,
            address: params.token,
            functionName: 'balanceOf',
            args: [walletAddr],
        }),
        clients.public.readContract({
            abi: erc20Abi,
            address: params.token,
            functionName: 'allowance',
            args: [walletAddr, params.spender],
        }),
    ]);
    if (balance < params.rawAmount) return 'NOT_ENOUGH_BALANCE';
    if (allowance >= params.rawAmount) return 'ALREADY_APPROVED';

    const tokenSymbol = await getTokenSymbol(clients.public, params.token);

    console.log(`Approving ${params.rawAmount} ${fmtTokenSymbol(tokenSymbol, params.token)} to ${params.spender}...`);

    if (!(await confirm({ message: 'Send approval transaction?' }))) {
        return 'CANCELLED';
    }

    const { request } = await clients.public.simulateContract({
        abi: erc20Abi,
        address: params.token,
        functionName: 'approve',
        args: [params.spender, params.rawAmount],
        account: clients.wallet.account,
    });
    const txHash = await clients.wallet.writeContract(request);
    console.log(`Approval tx hash:`, txHash);
    await clients.public.waitForTransactionReceipt({ hash: txHash });

    return 'SUCCESS';
}
