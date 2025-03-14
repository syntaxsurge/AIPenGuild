'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDownUp, Settings, RefreshCw, Wallet2 } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'

export default function MoveTokenSwap() {
  const { isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const [fromToken, setFromToken] = useState('WND')
  const [toToken, setToToken] = useState('USDT')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')

  return (
    <Card className='w-full max-w-md'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-2xl font-bold'>Swap</CardTitle>
        <Button variant='ghost' size='icon'>
          <Settings className='h-4 w-4' />
        </Button>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Max Slippage Selector */}
        <div className='flex items-center space-x-2 text-sm'>
          <span className='text-muted-foreground'>Max Slippage:</span>
          <Select value={slippage} onValueChange={setSlippage}>
            <SelectTrigger className='h-8 w-[80px]'>
              <SelectValue placeholder='Slippage' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='0.1'>0.1%</SelectItem>
              <SelectItem value='0.5'>0.5%</SelectItem>
              <SelectItem value='1.0'>1.0%</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Token Fields Container with Relative Positioning */}
        <div className='relative'>
          {/* From Token Card */}
          <Card>
            <CardContent className='p-3'>
              <div className='mb-2 flex justify-between'>
                <div className='flex items-center space-x-2'>
                  <Select value={fromToken} onValueChange={setFromToken}>
                    <SelectTrigger className='w-[100px]'>
                      <SelectValue placeholder='Token' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='WND'>WND</SelectItem>
                      <SelectItem value='USDT'>USDT</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type='number'
                    placeholder='0.00'
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className='border-0 text-2xl focus-visible:ring-0'
                  />
                </div>
                <div className='text-right'>
                  <p className='text-sm text-muted-foreground'>≈$ 3,694.73</p>
                </div>
              </div>
              <div className='flex items-center justify-between text-sm text-muted-foreground'>
                <span>Balance: 1.2345 WND</span>
                <Button variant='ghost' size='sm' className='h-auto px-2 py-0'>
                  Max
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Swap Button - Absolutely Positioned */}
          <div className='absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2'>
            <Button
              variant='outline'
              size='icon'
              className='h-10 w-10 rounded-full border-border bg-background'
              onClick={() => {
                setFromToken(toToken)
                setToToken(fromToken)
              }}
            >
              <ArrowDownUp className='h-4 w-4' />
            </Button>
          </div>

          {/* To Token Card */}
          <Card className='mt-2'>
            <CardContent className='p-3'>
              <div className='mb-2 flex justify-between'>
                <div className='flex items-center space-x-2'>
                  <Select value={toToken} onValueChange={setToToken}>
                    <SelectTrigger className='w-[100px]'>
                      <SelectValue placeholder='Token' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='WND'>WND</SelectItem>
                      <SelectItem value='USDT'>USDT</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type='number'
                    placeholder='0.00'
                    value={toAmount}
                    onChange={(e) => setToAmount(e.target.value)}
                    className='border-0 text-2xl focus-visible:ring-0'
                  />
                </div>
                <div className='text-right'>
                  <p className='text-sm text-muted-foreground'>≈$ 3,676.00</p>
                </div>
              </div>
              <div className='text-sm text-muted-foreground'>Balance: 5000.00 USDT</div>
            </CardContent>
          </Card>
        </div>

        {/* Rate and Details Section */}
        <Card>
          <CardContent className='space-y-3 p-3'>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>Rate</span>
              <div className='flex items-center'>
                <span>1 WND = 3,694.7358 USDT</span>
                <Button variant='ghost' size='icon' className='ml-1 h-6 w-6'>
                  <RefreshCw className='h-4 w-4' />
                </Button>
              </div>
            </div>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>Minimum Received</span>
              <span>3,676 USDT</span>
            </div>
            <div className='flex items-center justify-between text-sm'>
              <span className='text-muted-foreground'>Price Impact</span>
              <span>{'< 0.01%'}</span>
            </div>
          </CardContent>
        </Card>

        {isConnected ? (
          <Button className='w-full'>Swap</Button>
        ) : (
          <Button className='w-full' onClick={openConnectModal}>
            Connect Wallet
            <Wallet2 className='ml-2 h-4 w-4' />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
