import { Gltf, OrbitControls } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import {
  CapsuleCollider,
  CuboidCollider,
  CylinderCollider,
  Debug,
  InstancedRigidBodies,
  Physics,
  RigidBody,
} from "@react-three/rapier"
import { Perf } from "r3f-perf"
import { useEffect, useMemo, useRef, useState } from "react"
import { Euler, Matrix4, Quaternion, Vector3 } from "three"

export default function Experience() {
  const cube = useRef()
  const twister = useRef()
  const cubes = useRef()

  // create your sound only once
  const [hitSound] = useState(() => new Audio("./hit.mp3"))

  function jump() {
    // e.stopPropagation()
    const mass = cube.current.mass() // make the object jump to the same height regardless of the mass
    cube.current.applyImpulse({ x: 0, y: 5 * mass, z: 0 })
    cube.current.applyTorqueImpulse({ x: 0, y: 0.5 * mass, z: 0 })
  }

  useFrame((state, delta) => {
    const elapsedTime = state.clock.getElapsedTime()

    // update rotation along y
    const speed = 3
    const eulerRotation = new Euler(0, elapsedTime * speed, 0)
    const quaternionRotation = new Quaternion()
    quaternionRotation.setFromEuler(eulerRotation)
    twister.current.setNextKinematicRotation(quaternionRotation)

    // update position
    const radius = 2
    const angle = elapsedTime * 0.5
    twister.current.setNextKinematicTranslation({
      x: Math.sin(angle) * radius,
      y: -0.8,
      z: Math.cos(angle) * radius,
    })
  })

  function collisionEnter() {
    hitSound.currentTime = 0
    hitSound.volume = Math.random()
    hitSound.play()
  }

  const cubesCount = 100

  const cubesTransforms = useMemo(() => {
    const positions = []
    const rotations = []
    const scales = []

    for (let i = 0; i < cubesCount; i++) {
      const scale = 0.2 + Math.random() * 0.8
      positions.push([
        (Math.random() - 0.5) * 8,
        6 + i * 0.2,
        (Math.random() - 0.5) * 8,
      ])
      rotations.push([Math.random(), Math.random(), Math.random()])
      scales.push([scale, scale, scale])
    }

    return { positions, rotations, scales }
  }, [])

  //   useEffect(() => {
  //     for (let i = 0; i < cubesCount; i++) {
  //       const matrix = new Matrix4()
  //       matrix.compose(
  //         new Vector3(i * 2, 0, 0),
  //         new Quaternion(),
  //         new Vector3(1, 1, 1)
  //       )
  //       cubes.current.setMatrixAt(i, matrix)
  //     }
  //   }, [])

  return (
    <>
      <Perf position="top-left" />

      <OrbitControls makeDefault />

      <directionalLight castShadow position={[1, 2, 3]} intensity={1.5} />
      <ambientLight intensity={0.5} />

      <Physics gravity={[0, -9.81, 0]}>
        {/* <Debug /> */}

        <RigidBody colliders="ball">
          <mesh castShadow position={[-2, 3, 0]}>
            <sphereGeometry />
            <meshStandardMaterial color="orange" />
          </mesh>
        </RigidBody>

        {/* <RigidBody colliders={false} rotation-x={Math.PI * 0.5}>
          <CuboidCollider args={[1.5, 1.5, 0.5]} />
          <mesh castShadow>
            <torusGeometry args={[1, 0.5, 16, 32]} />
            <meshStandardMaterial color={"salmon"} />
          </mesh>
        </RigidBody> */}

        {/* cube */}
        <RigidBody
          ref={cube}
          gravityScale={1} // define the power of gravity over the object
          restitution={0.5} // bounciness
          friction={0.2} // an average between the two bodies (cube & floor) will determine overall effect
          colliders={false} // disable colliders in order to change mass
          position-x={2}
          position-y={2}
          onCollisionEnter={collisionEnter}
          //   onCollisionExit={() => {
          //     console.log("exit")
          //   }}
          //   onSleep={}
          // onWake={}
        >
          <CuboidCollider args={[0.5, 0.5, 0.5]} mass={2} />
          <mesh
            castShadow
            onClick={jump}
            /* adjust position, rotation on RigidBody
            if using definining your own collider */
            //   position-x={2}
            //   position-y={2}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={"mediumpurple"} />
          </mesh>
        </RigidBody>

        {/* twister */}
        <RigidBody
          ref={twister}
          type="kinematicPosition"
          position={[0, -0.8, 0]}
          friction={0}
        >
          <mesh castShadow scale={[0.4, 0.4, 3]}>
            <boxGeometry />
            <meshStandardMaterial color={"salmon"} />
          </mesh>
        </RigidBody>

        {/* burger */}
        <RigidBody position={[0, 4, 0]} colliders={false}>
          <CylinderCollider args={[0.5, 1.25]} />
          <Gltf src="./hamburger.glb" castShadow scale={0.25} />
        </RigidBody>

        {/* cubes */}
        <InstancedRigidBodies
          positions={cubesTransforms.positions}
          rotations={cubesTransforms.rotations}
          scales={cubesTransforms.scales}
        >
          <instancedMesh
            ref={cubes}
            args={[null, null, cubesCount]} // geometry, mesh, number of instances
            castShadow
          >
            <boxGeometry />
            <meshStandardMaterial color={"tomato"} />
          </instancedMesh>
        </InstancedRigidBodies>

        {/* Walls: t-r-b-l */}
        <RigidBody type="fixed">
          <CuboidCollider args={[5, 2, 0.5]} position={[0, 1, -5.25]} />
          <CuboidCollider args={[0.5, 2, 5]} position={[5, 1, 0]} />
          <CuboidCollider args={[5, 2, 0.5]} position={[0, 1, 5.25]} />
          <CuboidCollider args={[0.5, 2, 5]} position={[-5, 1, 0]} />
        </RigidBody>

        {/* floor */}
        <RigidBody type="fixed">
          <mesh receiveShadow position-y={-1.25}>
            <boxGeometry args={[10, 0.5, 10]} />
            <meshStandardMaterial color="greenyellow" />
          </mesh>
        </RigidBody>
      </Physics>
    </>
  )
}
