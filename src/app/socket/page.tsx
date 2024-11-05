"use client";

import { useSocket } from '@/hooks/useSocket';
import React from 'react'

export default function Page() {
    const { socket, isConnected } = useSocket()
    console.log(socket, isConnected);
    
  return (
    <div>page</div>
  )
}
