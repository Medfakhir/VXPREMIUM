'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Center } from '@react-three/drei'
import * as THREE from 'three'

function AnimatedSphere({ position, color }: { position: [number, number, number], color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1, 100, 200]} position={position}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.5}
          speed={2}
          roughness={0.1}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  )
}

function FloatingText() {
  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
      <Center>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[4, 1, 0.2]} />
          <meshStandardMaterial color="#00ffff" metalness={0.8} roughness={0.2} />
        </mesh>
      </Center>
    </Float>
  )
}

export default function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff0080" />
      
      <AnimatedSphere position={[-4, 0, 0]} color="#3b82f6" />
      <AnimatedSphere position={[4, 0, 0]} color="#8b5cf6" />
      <AnimatedSphere position={[0, 3, -2]} color="#06b6d4" />
      
      <FloatingText />
    </>
  )
}
