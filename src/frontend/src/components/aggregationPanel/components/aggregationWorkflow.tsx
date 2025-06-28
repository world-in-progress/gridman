import React, { useCallback } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import TestNode from './testNode';

const initialNodes = [
    {
        id: '1',
        type: 'input',
        data: { label: 'Input Node' },
        position: { x: 250, y: 25 },
    },

    {
        id: '2',
        type: 'testNode',
        data: { label: <div>Default Node</div> },
        position: { x: 100, y: 125 },
    },
    {
        id: '3',
        type: 'output',
        data: { label: 'Output Node' },
        position: { x: 250, y: 250 },
    },
];
const initialEdges = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3', animated: true },
];

const nodeTypes = { testNode: TestNode };

export default function AggregationWorkflow() {
    const [nodes, setNodes] = useNodesState(initialNodes);
    const [edges, setEdges] = useEdgesState(initialEdges);

    return (
        <div className='w-full h-[40vh] rounded-md shadow-lg bg-white mt-2'>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
            >
                <Controls />
                {/* <MiniMap/> */}
                <Background variant={BackgroundVariant.Lines} gap={36} size={1} />
            </ReactFlow>
        </div>
    )
}



