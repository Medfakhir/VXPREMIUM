'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Torus, Box } from '@react-three/drei'
import * as THREE from 'three'

function AnimatedSphere({ position, color }: { position: [number, number, number], color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.5
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.8} floatIntensity={1.5}>
      <Sphere ref={meshRef} args={[1, 64, 64]} position={position}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.1}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  )
}

function AnimatedTorus({ position, color }: { position: [number, number, number], color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.2
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
      <Torus ref={meshRef} args={[1.5, 0.3, 16, 100]} position={position}>
        <meshStandardMaterial
          color={color}
          metalness={0.9}
          roughness={0.1}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </Torus>
    </Float>
  )
}

function AnimatedBox({ position, color }: { position: [number, number, number], color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.4
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.4
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.2
    }
  })

  return (
    <Float speed={1.8} rotationIntensity={0.6} floatIntensity={1.2}>
      <Box ref={meshRef} args={[1.2, 1.2, 1.2]} position={position}>
        <meshStandardMaterial
          color={color}
          metalness={0.7}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={0.2}
          wireframe={false}
        />
      </Box>
    </Float>
  )
}

export default function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ffff" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#ff0080" />
      <pointLight position={[0, 10, -10]} intensity={0.8} color="#8000ff" />
      <spotLight position={[0, 15, 0]} intensity={0.5} angle={0.3} penumbra={1} color="#00ff80" />
      
      {/* Main spheres */}
      <AnimatedSphere position={[-4, 0, 0]} color="#00ffff" />
      <AnimatedSphere position={[4, 0, 0]} color="#8b5cf6" />
      <AnimatedSphere position={[0, 3, -2]} color="#06b6d4" />
      
      {/* Torus rings */}
      <AnimatedTorus position={[0, -2, -3]} color="#ff0080" />
      <AnimatedTorus position={[3, 2, -4]} color="#00ff80" />
      
      {/* Floating boxes */}
      <AnimatedBox position={[-3, -3, -2]} color="#ffff00" />
      <AnimatedBox position={[5, -1, -3]} color="#ff00ff" />
    </>
  )
}
