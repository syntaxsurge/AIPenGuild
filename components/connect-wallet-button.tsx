import { Button } from '@/components/ui/button'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { IconChevronDown } from '@tabler/icons-react'

export default function ConnectWalletBtn() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted
        const connected = ready && account && chain

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none'
              }
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    variant='default'
                    className='rounded-none bg-foreground text-background hover:bg-foreground/90'
                  >
                    Connect Wallet
                  </Button>
                )
              }

              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    variant='destructive'
                    className='rounded-none bg-foreground text-background hover:bg-foreground/90'
                  >
                    Wrong network
                  </Button>
                )
              }

              return (
                <div className='flex items-center gap-2'>
                  <Button
                    onClick={openChainModal}
                    variant='default'
                    className='rounded-none bg-foreground text-background hover:bg-foreground/90'
                  >
                    {chain.name && chain.name.length > 10
                      ? `${chain.name.slice(0, 5)}..${chain.name.slice(-5)}`
                      : chain.name}
                    <IconChevronDown className='size-4' />
                  </Button>

                  <Button
                    onClick={openAccountModal}
                    variant='default'
                    className='rounded-none bg-foreground text-background hover:bg-foreground/90'
                  >
                    {account.displayName}
                  </Button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}