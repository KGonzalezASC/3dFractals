import {Canvas, useThree} from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import {PythagorasSphereTree, ResultTree, SierpinskiPyramid} from "./components/threeHandler.tsx";
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import {useEffect} from "react";



const ExportSceneButton = () => {
    //make sure it is called within canvas and must return null
    const { scene,gl } = useThree();

    useEffect(() => {
        const exportScene = () => {
            //remove the grid helper in export process
            const grid = scene.getObjectByName("grid");
            if(grid){
                scene.remove(grid);
            }

            const exporter = new GLTFExporter();
            exporter.parse(scene, (gltf) => {
                const stringGLTF = JSON.stringify(gltf);
                const base64EncodedGLTF = btoa(stringGLTF);
                const resultingDataURI = `data:application/octet-stream;base64,${base64EncodedGLTF}`;
                // console.log(resultingDataURI);
                const link = document.createElement('a');
                link.href = resultingDataURI;
                // Suggest a filename for the download
                link.download = 'scene.gltf';
                // Append the anchor to the body
                document.body.appendChild(link);
                // Trigger a click event on the anchor
                link.click();
                // Remove the anchor from the body
                document.body.removeChild(link);

                if(grid){
                    scene.add(grid);
                }
                //wont cause error ignore
            }, { binary: true });
        };

        document.getElementById('export-button')?.addEventListener('click', exportScene);

        return () => {
            document.getElementById('export-button')?.removeEventListener('click', exportScene);
        };
    }, [gl, scene]);

    return null; // This component SHOULD NOT render content
};



const App = () => {
    return (
        <>
            <Canvas style={{width: '100vw', height: '600px'}}>
                <ambientLight/>
                <OrbitControls/>
                <PerspectiveCamera
                    makeDefault
                    position={[100, 0, 350]}
                    fov={90}
                    zoom={8}/>
                {/*<SierpinskiPyramid size ={20} iterations={4}/>*/}
                {/*<PythagorasPathTree size={20} iterations={7} onGeometryReady={handlePathTreeGeometryReady} />*/}
                <ResultTree/>
                {/*<gridHelper args={[100, 100]} name={"grid"}/>*/}
                <ExportSceneButton/>
            </Canvas>
            <button id="export-button" style={{position: 'absolute', top: '10px', right: '10px'}}>
                Export Scene
            </button>
        </>
    );
};

export default App;
