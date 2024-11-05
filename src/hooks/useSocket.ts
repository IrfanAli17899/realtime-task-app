'use client'

import { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'
import { getSocket } from '@/libs/socket'

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketInstance = getSocket()

    socketInstance.on('connect', () => {
      console.log('Connected to Socket.IO')
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from Socket.IO')
      setIsConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      if (socketInstance) {
        socketInstance.disconnect()
      }
    }
  }, [])

  return { socket, isConnected }
}