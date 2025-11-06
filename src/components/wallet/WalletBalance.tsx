import { useAccount, useBalance } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink, TrendingUp, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { polygonMainnet } from '@/lib/web3-config'
import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  timeStamp: string
  isError: string
  gasUsed: string
  gasPrice: string
}

export function WalletBalance() {
  const { address, isConnected } = useAccount()
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
    chainId: polygonMainnet.id,
  })

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [txLoading, setTxLoading] = useState(false)

  useEffect(() => {
    if (!address) return

    const fetchTransactions = async () => {
      setTxLoading(true)
      try {
        // Using Polygonscan API to fetch transactions
        const response = await fetch(
          `https://api.polygonscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=YourApiKeyToken`
        )
        const data = await response.json()
        
        if (data.status === '1' && Array.isArray(data.result)) {
          setTransactions(data.result)
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error)
      } finally {
        setTxLoading(false)
      }
    }

    fetchTransactions()
  }, [address])

  if (!isConnected || !address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Balance
          </CardTitle>
          <CardDescription>Connect your wallet to view balance</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const formatValue = (value: string) => {
    const maticValue = parseInt(value) / 1e18
    return maticValue.toFixed(4)
  }

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            MATIC Balance
          </CardTitle>
          <CardDescription>Polygon Network</CardDescription>
        </CardHeader>
        <CardContent>
          {balanceLoading ? (
            <Skeleton className="h-12 w-32" />
          ) : (
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {balance?.formatted ? parseFloat(balance.formatted).toFixed(4) : '0.0000'}
                </span>
                <span className="text-lg text-muted-foreground">MATIC</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
              <CardDescription>Last 10 transactions on Polygon</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <a
                href={`https://polygonscan.com/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                View All
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No transactions found
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.hash}
                  className="flex items-start justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        tx.from.toLowerCase() === address.toLowerCase()
                          ? 'bg-orange-500/10 text-orange-500'
                          : 'bg-green-500/10 text-green-500'
                      }`}>
                        {tx.from.toLowerCase() === address.toLowerCase() ? 'Sent' : 'Received'}
                      </span>
                      {tx.isError === '1' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-500">
                          Failed
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium truncate">
                        {tx.from.toLowerCase() === address.toLowerCase() ? 'To: ' : 'From: '}
                        {tx.from.toLowerCase() === address.toLowerCase() 
                          ? `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`
                          : `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(parseInt(tx.timeStamp) * 1000), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-medium">
                      {formatValue(tx.value)} MATIC
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      asChild
                    >
                      <a
                        href={`https://polygonscan.com/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
